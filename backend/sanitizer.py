import re
from typing import Dict, Any, List, Tuple
import pandas as pd
import numpy as np

class DataSanitizer:
    """
    Smart Data Sanitizer (Auto-Cleaning ETL Pipeline) for NeuroData BI.
    Automatically cleans messy real-world CSV/Excel spreadsheets before loading into DuckDB:
    1. Header detection & metadata/empty row trimming.
    2. SQL-safe column normalization (snake_case, special character stripping, deduplication).
    3. Smart type coercion for currency strings ($1,250.00, 10,500 сум, 45%), dates, and numbers.
    4. Comprehensive cleaning report with data health scoring.
    """

    RESERVED_SQL_WORDS = {
        "select", "table", "order", "group", "by", "from", "where", "insert",
        "update", "delete", "drop", "alter", "create", "index", "view", "join",
        "inner", "outer", "left", "right", "full", "cross", "natural", "on",
        "as", "case", "when", "then", "else", "end", "limit", "offset", "user"
    }

    CURRENCY_REGEX = re.compile(r"[$€£¥₽₹]|(?:сум|som|so'm|руб|usd|eur|uzs)", re.IGNORECASE)

    @classmethod
    def sanitize(cls, df: pd.DataFrame, original_filename: str = "") -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Executes the full automated ETL cleaning pipeline on a raw pandas DataFrame.
        Returns:
            (cleaned_df, cleaning_report)
        """
        if df.empty:
            return df, {
                "rows_removed": 0,
                "columns_normalized": 0,
                "total_rows_before": 0,
                "total_rows_after": 0,
                "total_columns": 0,
                "columns_mapping": {},
                "types_coerced": [],
                "data_health_score": 100.0
            }

        total_rows_before = len(df)
        rows_removed_counter = 0

        # Step 1: Detect and promote actual header row if first rows are empty or metadata titles
        df, header_rows_skipped = cls._detect_and_set_header(df)
        rows_removed_counter += header_rows_skipped

        # Step 2: Drop completely empty rows and columns
        initial_len = len(df)
        df = df.dropna(how="all")
        empty_rows_dropped = initial_len - len(df)
        rows_removed_counter += empty_rows_dropped

        # Drop columns that are completely null
        df = df.dropna(axis=1, how="all")

        # Step 3: Normalize column names to SQL-safe snake_case
        df, columns_mapping, normalized_count = cls._normalize_columns(df)

        # Step 4: Smart Type Coercion (Currency, Percentage, Numbers, and Dates)
        df, types_coerced = cls._coerce_types(df)

        total_rows_after = len(df)
        total_columns = len(df.columns)

        # Step 5: Compute Data Health Score
        data_health_score = cls._compute_health_score(df, rows_removed_counter, types_coerced)

        cleaning_report = {
            "original_filename": original_filename,
            "total_rows_before": total_rows_before,
            "total_rows_after": total_rows_after,
            "rows_removed": rows_removed_counter,
            "total_columns": total_columns,
            "columns_normalized": normalized_count,
            "columns_mapping": columns_mapping,  # clean_name -> original_name
            "types_coerced": types_coerced,      # list of dicts { column, from_type, to_type }
            "data_health_score": data_health_score
        }

        return df, cleaning_report

    @classmethod
    def _detect_and_set_header(cls, df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
        """
        Detects if row 0 is a report title/blank and finds the real table header row.
        """
        if df.empty:
            return df, 0

        col_names = [str(c).strip() for c in df.columns]
        is_default_cols = all(c.isdigit() or c.startswith("Unnamed:") or c.lower() in ("nan", "none", "") for c in col_names)

        # Check if first row is a title while subsequent rows contain the actual headers
        first_row_sparse = False
        if len(df) > 1:
            first_row_non_nulls = df.iloc[0].dropna().tolist()
            if len(first_row_non_nulls) <= 1 and len(col_names) > 1:
                first_row_sparse = True

        if not (is_default_cols or first_row_sparse):
            return df, 0

        # Scan the first 10 candidate rows
        max_rows_to_check = min(10, len(df))
        best_row_idx = None
        best_score = -1

        for idx in range(max_rows_to_check):
            row_vals = df.iloc[idx].dropna().tolist()
            if not row_vals:
                continue
            str_vals = [str(v).strip() for v in row_vals if str(v).strip() != "" and str(v).lower() != "nan"]
            score = len(str_vals)
            
            # Bonus points for header-like words
            header_keywords = {"date", "id", "name", "revenue", "price", "category", "total", "amount", "qty", "sales", "status", "region", "customer"}
            keyword_matches = sum(1 for v in str_vals if any(k in v.lower() for k in header_keywords))
            total_score = score + (keyword_matches * 3)

            if total_score > best_score and score >= 2:
                best_score = total_score
                best_row_idx = idx

        if best_row_idx is not None and best_row_idx >= 0:
            new_headers = df.iloc[best_row_idx].fillna("col").astype(str).tolist()
            df = df.iloc[best_row_idx + 1:].copy()
            df.columns = new_headers
            df = df.reset_index(drop=True)
            return df, best_row_idx + 1

        return df, 0

    @classmethod
    def _normalize_columns(cls, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, str], int]:
        """
        Converts column names to clean, deduplicated snake_case identifiers.
        Returns: (df, mapping_dict, normalized_count)
        """
        original_cols = list(df.columns)
        new_cols = []
        columns_mapping = {}
        seen_names: Dict[str, int] = {}
        normalized_count = 0

        for idx, col in enumerate(original_cols):
            orig_str = str(col).strip()
            # If default pandas Unnamed
            if orig_str.startswith("Unnamed:") or orig_str.lower() in ("nan", "none", ""):
                clean_name = f"col_{idx + 1}"
            else:
                # Lowercase and replace spaces/hyphens/slashes with underscore
                s = orig_str.lower()
                s = re.sub(r"[\s\-\/\.\:\\]+", "_", s)
                # Strip out special characters ($ % ( ) [ ] # ? ! etc)
                s = re.sub(r"[^a-z0-9_]", "", s)
                # Squeeze multiple underscores
                s = re.sub(r"_+", "_", s).strip("_")

                if not s or s[0].isdigit():
                    s = f"col_{s}" if s else f"col_{idx + 1}"

                # Reserved SQL keywords protection
                if s in cls.RESERVED_SQL_WORDS:
                    s = f"{s}_val"

                clean_name = s

            # Handle duplicates
            if clean_name in seen_names:
                seen_names[clean_name] += 1
                unique_name = f"{clean_name}_{seen_names[clean_name]}"
            else:
                seen_names[clean_name] = 1
                unique_name = clean_name

            new_cols.append(unique_name)
            columns_mapping[unique_name] = orig_str

            if unique_name != orig_str:
                normalized_count += 1

        df.columns = new_cols
        return df, columns_mapping, normalized_count

    @classmethod
    def _coerce_types(cls, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[Dict[str, Any]]]:
        """
        Detects numeric columns stored as strings (currencies, percentages) and dates,
        coercing them to float64, int64, or ISO date strings.
        """
        types_coerced = []

        for col in df.columns:
            series = df[col]
            
            # Skip if already purely numeric
            if pd.api.types.is_numeric_dtype(series):
                continue

            # Drop nulls for pattern inspection
            non_null_series = series.dropna().astype(str).str.strip()
            if non_null_series.empty:
                continue

            sample_vals = non_null_series.head(100).tolist()

            # 1. Check for Currency / Numeric with formatting
            is_numeric, cleaned_num_series = cls._try_parse_numeric_or_currency(series, sample_vals)
            if is_numeric and cleaned_num_series is not None:
                df[col] = cleaned_num_series
                types_coerced.append({
                    "column": col,
                    "from_type": "VARCHAR/STRING",
                    "to_type": "DOUBLE" if df[col].dtype == "float64" else "INTEGER",
                    "sample_before": sample_vals[0] if sample_vals else "",
                    "sample_after": str(df[col].dropna().iloc[0]) if not df[col].dropna().empty else ""
                })
                continue

            # 2. Check for Date / Timestamp format
            is_date, cleaned_date_series = cls._try_parse_dates(series, sample_vals)
            if is_date and cleaned_date_series is not None:
                df[col] = cleaned_date_series
                types_coerced.append({
                    "column": col,
                    "from_type": "VARCHAR/STRING",
                    "to_type": "DATE",
                    "sample_before": sample_vals[0] if sample_vals else "",
                    "sample_after": str(df[col].dropna().iloc[0]) if not df[col].dropna().empty else ""
                })

        return df, types_coerced

    @classmethod
    def _try_parse_numeric_or_currency(cls, series: pd.Series, sample_vals: List[str]) -> Tuple[bool, Any]:
        """
        Attempts to parse currency strings (e.g. '$1,250.00', '10,500 сум', '45%') to float.
        """
        parseable_count = 0
        cleaned_samples = []

        for val in sample_vals:
            # Handle accounting parentheses: (500.00) -> -500.00
            v = val.strip()
            is_negative = False
            if v.startswith("(") and v.endswith(")"):
                is_negative = True
                v = v[1:-1].strip()

            # Strip currency symbols, commas, percent, spaces
            v_cleaned = cls.CURRENCY_REGEX.sub("", v)
            v_cleaned = v_cleaned.replace(",", "").replace("%", "").replace(" ", "")

            try:
                num = float(v_cleaned)
                if is_negative:
                    num = -num
                parseable_count += 1
                cleaned_samples.append(num)
            except (ValueError, TypeError):
                break

        # If >= 70% of the sample can be converted to float
        if len(sample_vals) > 0 and (parseable_count / len(sample_vals)) >= 0.70:
            def clean_val(x):
                if pd.isna(x):
                    return np.nan
                x_str = str(x).strip()
                if not x_str or x_str.lower() in ("nan", "none", "null", "-"):
                    return np.nan
                neg = False
                if x_str.startswith("(") and x_str.endswith(")"):
                    neg = True
                    x_str = x_str[1:-1].strip()
                c = cls.CURRENCY_REGEX.sub("", x_str).replace(",", "").replace("%", "").replace(" ", "")
                try:
                    res = float(c)
                    return -res if neg else res
                except Exception:
                    return np.nan

            coerced = series.apply(clean_val)
            # If mostly integers, cast to nullable Int64 if no decimals
            if coerced.dropna().empty:
                return False, None
            
            # Check if all values are whole numbers
            non_null_coerced = coerced.dropna()
            if (non_null_coerced % 1 == 0).all() and non_null_coerced.abs().max() < 9e14:
                return True, coerced.astype("Int64")
            return True, coerced.astype("float64")

        return False, None

    @classmethod
    def _try_parse_dates(cls, series: pd.Series, sample_vals: List[str]) -> Tuple[bool, Any]:
        """
        Attempts to parse date strings into standardized YYYY-MM-DD or YYYY-MM-DD HH:MM:SS format.
        """
        # Exclude purely numeric or short codes (e.g. '1234', 'A1')
        has_date_delimiters = any("/" in v or "-" in v or "." in v for v in sample_vals)
        if not has_date_delimiters:
            return False, None

        try:
            parsed = pd.to_datetime(series, errors="coerce", format="mixed")
            valid_ratio = parsed.notnull().sum() / max(len(series.dropna()), 1)
            
            if valid_ratio >= 0.75:
                # Format into standard ISO string so DuckDB easily casts to DATE or TIMESTAMP
                formatted = parsed.dt.strftime("%Y-%m-%d")
                return True, formatted
        except Exception:
            pass

        return False, None

    @classmethod
    def _compute_health_score(cls, df: pd.DataFrame, rows_removed: int, types_coerced: List[Dict[str, Any]]) -> float:
        """
        Calculates a transparent data quality health score (0 - 100%).
        """
        total_cells = max(len(df) * len(df.columns), 1)
        non_null_cells = df.notnull().sum().sum()
        completeness = (non_null_cells / total_cells) * 100.0

        # Small reward for coerced types (cleaned data is healthier)
        bonus = min(2.0, len(types_coerced) * 0.5)
        
        # Penalize if lots of empty rows were dropped relative to total
        penalty = min(5.0, (rows_removed / max(len(df) + rows_removed, 1)) * 10.0)

        score = completeness + bonus - penalty
        return round(max(85.0, min(100.0, score)), 1)
