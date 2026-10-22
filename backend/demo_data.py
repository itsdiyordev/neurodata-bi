import random
from datetime import datetime, timedelta
from typing import Dict
import pandas as pd

def generate_relational_demo_datasets() -> Dict[str, pd.DataFrame]:
    """
    Generates 3 interconnected relational demo tables for DuckDB:
    - orders: fact table (350+ rows) with order_id, order_date, customer_id, product_id, region, quantity, revenue (March anomaly preserved)
    - customers: dimension table (80+ rows) with customer_id, customer_name, segment, signup_date, lifetime_value
    - products: dimension table (25+ rows) with product_id, product_name, category, cost_price, profit_margin
    """
    random.seed(42)

    # 1. Products Dimension Table (26 items)
    raw_products = [
        ("PROD-101", "ProBook Ultra 16", "Hardware & Laptops", 1400.0, 0.32),
        ("PROD-102", "ThinkCore Workstation X1", "Hardware & Laptops", 1800.0, 0.33),
        ("PROD-103", "DevBox Studio M3", "Hardware & Laptops", 2300.0, 0.35),
        ("PROD-104", "UltraSlim Air 14", "Hardware & Laptops", 950.0, 0.31),
        ("PROD-105", "CarbonBook Pro 15", "Hardware & Laptops", 1600.0, 0.28),
        ("PROD-106", "Enterprise Edge Server 2U", "Hardware & Laptops", 3200.0, 0.40),
        
        ("PROD-201", "Dedicated GPU Pod H100", "Cloud & Infrastructure", 3100.0, 0.45),
        ("PROD-202", "High-Memory Node 128GB", "Cloud & Infrastructure", 1100.0, 0.45),
        ("PROD-203", "Kubernetes Cluster Node", "Cloud & Infrastructure", 2600.0, 0.46),
        ("PROD-204", "Global CDN Enterprise", "Cloud & Infrastructure", 650.0, 0.46),
        ("PROD-205", "Distributed Object Storage 10TB", "Cloud & Infrastructure", 450.0, 0.50),
        ("PROD-206", "VPC Dedicated Gateway", "Cloud & Infrastructure", 850.0, 0.42),
        
        ("PROD-301", "4K UltraFine 32-inch Monitor", "Accessories & Displays", 520.0, 0.38),
        ("PROD-302", "Mechanical Ergonomic Keyboard", "Accessories & Displays", 120.0, 0.50),
        ("PROD-303", "Thunderbolt 4 Pro Dock", "Accessories & Displays", 190.0, 0.47),
        ("PROD-304", "Noise-Canceling ANC Headset", "Accessories & Displays", 160.0, 0.50),
        ("PROD-305", "Precision Wireless Mouse", "Accessories & Displays", 65.0, 0.52),
        ("PROD-306", "Conference AI Bar 4K", "Accessories & Displays", 850.0, 0.35),
        
        ("PROD-401", "CyberShield Endpoint Defense", "Software & Security", 750.0, 0.60),
        ("PROD-402", "DataFlow Analytics Suite", "Software & Security", 1350.0, 0.55),
        ("PROD-403", "DevSecOps CI/CD License", "Software & Security", 920.0, 0.57),
        ("PROD-404", "AI Copilot Team Seats (10x)", "Software & Security", 480.0, 0.66),
        ("PROD-405", "Cloud SIEM Event Ingest", "Software & Security", 1800.0, 0.50),
        ("PROD-406", "ZeroTrust Access Gateway", "Software & Security", 1100.0, 0.52),
        ("PROD-407", "Database Encryption Engine", "Software & Security", 1400.0, 0.48),
        ("PROD-408", "Identity Governance Platform", "Software & Security", 2200.0, 0.55)
    ]

    products_df = pd.DataFrame(raw_products, columns=[
        "product_id", "product_name", "category", "cost_price", "profit_margin"
    ])

    # 2. Customers Dimension Table (85 customers)
    first_names = [
        "Apex", "Summit", "Vanguard", "Nexus", "Quantum", "Hyperion", "Starlight", "Atlas",
        "Echo", "Falcon", "Horizon", "Meridian", "Nova", "Omni", "Prism", "Sovereign",
        "Vertex", "Zenith", "Borealis", "Catalyst", "Dynasty", "Fortress", "Genesis", "Ironclad",
        "Jupiter", "Krypton", "Lumina", "Matrix", "Neutron", "Obsidian", "Pinnacle", "Radiant"
    ]
    suffixes = ["Technologies", "Ventures", "Systems", "Corp", "Enterprises", "Labs", "Digital", "Logistics", "Networks"]
    
    consumer_names = [
        "Alexander Wright", "Elena Rostova", "Marcus Chen", "Sarah Jenkins", "David Kim",
        "Olivia Taylor", "Liam O'Connor", "Aria Patel", "James Wilson", "Chloe Martin",
        "Ethan Brooks", "Sophia Alvarez", "Noah Campbell", "Isabella Rossi", "Lucas Becker"
    ]

    segments = ["Enterprise", "SMB", "Consumer"]
    segment_weights = [0.45, 0.40, 0.15]
    
    customers_data = []
    signup_start = datetime(2022, 1, 1)
    
    for c_idx in range(1, 86):
        cid = f"CUST-{1000 + c_idx}"
        seg = random.choices(segments, weights=segment_weights)[0]
        if seg == "Consumer":
            cname = random.choice(consumer_names) + f" #{c_idx}"
            ltv_base = random.uniform(1500, 6000)
        elif seg == "SMB":
            cname = f"{random.choice(first_names)} {random.choice(suffixes)}"
            ltv_base = random.uniform(8000, 35000)
        else: # Enterprise
            cname = f"{random.choice(first_names)} Global {random.choice(suffixes)}"
            ltv_base = random.uniform(40000, 180000)
            
        signup_dt = signup_start + timedelta(days=random.randint(0, 700))
        customers_data.append({
            "customer_id": cid,
            "customer_name": cname,
            "segment": seg,
            "signup_date": signup_dt.strftime("%Y-%m-%d"),
            "lifetime_value": round(ltv_base, 2)
        })
        
    customers_df = pd.DataFrame(customers_data)

    # 3. Orders Fact Table (365 rows)
    regions = ["North America", "EMEA", "APAC", "LATAM"]
    region_weights = [0.45, 0.30, 0.18, 0.07]

    orders_start = datetime(2024, 1, 1)
    orders_end = datetime(2024, 6, 30)
    total_days = (orders_end - orders_start).days

    orders_data = []
    prod_lookup = {row["product_id"]: row for _, row in products_df.iterrows()}
    cust_lookup = {row["customer_id"]: row for _, row in customers_df.iterrows()}
    
    customer_ids = list(cust_lookup.keys())
    product_ids = list(prod_lookup.keys())

    for o_idx in range(1, 366):
        oid = f"ORD-{2024000 + o_idx}"
        day_offset = random.randint(0, total_days)
        order_date = orders_start + timedelta(days=day_offset)
        month = order_date.month

        cid = random.choice(customer_ids)
        c_seg = cust_lookup[cid]["segment"]

        pid = random.choice(product_ids)
        p_info = prod_lookup[pid]
        base_unit_price = round(p_info["cost_price"] / (1.0 - p_info["profit_margin"]), 2)

        # Quantity scaling by customer segment
        if c_seg == "Enterprise":
            qty = random.choices([2, 3, 5, 8, 12], weights=[0.30, 0.30, 0.20, 0.15, 0.05])[0]
        elif c_seg == "SMB":
            qty = random.choices([1, 2, 3, 4], weights=[0.40, 0.35, 0.15, 0.10])[0]
        else:
            qty = random.choices([1, 2], weights=[0.85, 0.15])[0]

        reg = random.choices(regions, weights=region_weights)[0]

        # March Anomaly: Supply chain disruption in Hardware & Cloud
        if month == 3:
            if "Hardware" in p_info["category"] or "Cloud" in p_info["category"]:
                if random.random() < 0.65:
                    qty = 1
                    base_unit_price = round(base_unit_price * 0.45, 2)
            revenue = round(base_unit_price * qty * random.uniform(0.70, 0.85), 2)
        else:
            multiplier = 1.15 if month in (5, 6) else 1.0
            revenue = round(base_unit_price * qty * random.uniform(0.95, 1.05) * multiplier, 2)

        orders_data.append({
            "order_id": oid,
            "order_date": order_date.strftime("%Y-%m-%d"),
            "customer_id": cid,
            "product_id": pid,
            "region": reg,
            "quantity": qty,
            "revenue": revenue
        })

    orders_df = pd.DataFrame(orders_data).sort_values(by="order_date").reset_index(drop=True)

    return {
        "orders": orders_df,
        "customers": customers_df,
        "products": products_df
    }

def generate_demo_dataset() -> pd.DataFrame:
    """Legacy helper returning orders dataframe for backward compatibility."""
    return generate_relational_demo_datasets()["orders"]
