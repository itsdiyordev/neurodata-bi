import random
from datetime import datetime, timedelta
import pandas as pd

def generate_demo_dataset() -> pd.DataFrame:
    """
    Generates a realistic B2B/B2C E-commerce Sales Dataset (360+ rows).
    Includes intentional business anomalies:
    - Overall sales dropped significantly in March 2024 due to a critical supply chain disruption
      in 'Enterprise Server' and 'High-End Laptops' components and shipping port bottlenecks.
    - Top performing category: 'Cloud Infrastructure' & 'AI Hardware'
    - Customer Segments: 'Enterprise', 'SMB', 'Consumer'
    - Regions: 'North America', 'EMEA', 'APAC', 'LATAM'
    """
    random.seed(42)
    
    categories = {
        "Hardware & Laptops": [
            ("ProBook Ultra 16", 1850.0),
            ("ThinkCore Workstation X1", 2400.0),
            ("DevBox Studio M3", 3100.0),
            ("UltraSlim Air 14", 1250.0),
        ],
        "Cloud & Infrastructure": [
            ("Dedicated GPU Pod H100", 4500.0),
            ("High-Memory Node 128GB", 1600.0),
            ("Enterprise Kubernetes Cluster", 3800.0),
            ("Global CDN Enterprise Plan", 950.0),
        ],
        "Accessories & Displays": [
            ("4K UltraFine 32-inch Monitor", 720.0),
            ("Mechanical Ergonomic Keyboard", 180.0),
            ("Thunderbolt 4 Pro Dock", 280.0),
            ("Noise-Canceling ANC Headset", 240.0),
        ],
        "Software & Security": [
            ("CyberShield Endpoint Defense", 1200.0),
            ("DataFlow Analytics Suite", 2100.0),
            ("DevSecOps CI/CD License", 1450.0),
            ("AI Copilot Team Seats (10x)", 800.0),
        ]
    }
    
    regions = ["North America", "EMEA", "APAC", "LATAM"]
    region_weights = [0.45, 0.30, 0.18, 0.07]
    
    segments = ["Enterprise", "SMB", "Consumer"]
    segment_weights = [0.50, 0.35, 0.15]
    
    start_date = datetime(2024, 1, 1)
    end_date = datetime(2024, 6, 30)
    total_days = (end_date - start_date).days
    
    records = []
    
    # Generate ~380 records distributed across 6 months
    for i in range(1, 381):
        # Pick a date
        day_offset = random.randint(0, total_days)
        order_date = start_date + timedelta(days=day_offset)
        month = order_date.month
        
        # Pick category and product
        cat_name = random.choice(list(categories.keys()))
        product_name, base_price = random.choice(categories[cat_name])
        
        region = random.choices(regions, weights=region_weights)[0]
        segment = random.choices(segments, weights=segment_weights)[0]
        
        # Quantity logic
        if segment == "Enterprise":
            qty = random.choices([2, 3, 5, 8, 12], weights=[0.3, 0.3, 0.2, 0.15, 0.05])[0]
        elif segment == "SMB":
            qty = random.choices([1, 2, 3, 4], weights=[0.4, 0.3, 0.2, 0.1])[0]
        else:
            qty = random.choices([1, 2], weights=[0.8, 0.2])[0]
            
        # Intentional anomaly for March:
        # Sales drop sharply in March due to supply chain stockouts in hardware and enterprise procurement freezes
        if month == 3:
            # 60% chance to drop quantity to 1 or skip high-ticket orders
            if "Hardware" in cat_name or "Cloud" in cat_name:
                # Severe drop: 50% discount forced due to stockout delays and canceled batch orders
                if random.random() < 0.65:
                    qty = 1
                    base_price = base_price * 0.45  # Heavily discounted refund or penalty
            revenue = round(base_price * qty * random.uniform(0.70, 0.85), 2)
        else:
            # Normal months
            multiplier = 1.0
            if month in (5, 6): # Q2 recovery boom
                multiplier = 1.15
            revenue = round(base_price * qty * random.uniform(0.92, 1.08) * multiplier, 2)
            
        records.append({
            "order_id": f"ORD-{2024000 + i}",
            "date": order_date.strftime("%Y-%m-%d"),
            "product_name": product_name,
            "category": cat_name,
            "region": region,
            "customer_segment": segment,
            "quantity": qty,
            "revenue": revenue
        })
        
    df = pd.DataFrame(records)
    df = df.sort_values(by="date").reset_index(drop=True)
    return df

if __name__ == "__main__":
    df = generate_demo_dataset()
    print("Demo dataset shape:", df.shape)
    print("March revenue vs Feb revenue:")
    df["month"] = pd.to_datetime(df["date"]).dt.month
    print(df.groupby("month")["revenue"].sum())
