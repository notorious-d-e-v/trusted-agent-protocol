# © 2025 Visa.
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

from app.database.database import SessionLocal, create_tables
from app.models.models import Product

def create_sample_products():
    """Create sample products for testing"""
    db = SessionLocal()
    
    sample_products = [
        # === Tier 1: $0.50 - $4.99 (Registered agents) ===
        {
            "name": "API Health Check",
            "description": "Single API endpoint health check call with response time metrics",
            "price": 0.50,
            "category": "API Access",
            "image_url": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31",
            "stock_quantity": 1000
        },
        {
            "name": "Weather Data Query",
            "description": "Real-time weather data for any global location with 7-day forecast",
            "price": 1.00,
            "category": "Data & Analytics",
            "image_url": "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b",
            "stock_quantity": 500
        },
        {
            "name": "Basic Analytics Report",
            "description": "Auto-generated analytics summary with key metrics and trends",
            "price": 2.99,
            "category": "Data & Analytics",
            "image_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71",
            "stock_quantity": 200
        },
        {
            "name": "Stock Quote Bundle",
            "description": "Bundle of 10 real-time stock quote queries with volume data",
            "price": 3.99,
            "category": "Digital Services",
            "image_url": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3",
            "stock_quantity": 300
        },
        {
            "name": "Digital Sticker Pack",
            "description": "AI-generated digital sticker collection for agent avatars and branding",
            "price": 1.99,
            "category": "Digital Services",
            "image_url": "https://images.unsplash.com/photo-1561070791-2526d30994b5",
            "stock_quantity": 999
        },
        # === Tier 2: $5.00 - $19.99 (Reputable agents) ===
        {
            "name": "Premium API Access (1 Hour)",
            "description": "Unlimited API calls for one hour with priority rate limits",
            "price": 9.99,
            "category": "API Access",
            "image_url": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8",
            "stock_quantity": 100
        },
        {
            "name": "Market Intelligence Report",
            "description": "Comprehensive market analysis with competitor insights and forecasts",
            "price": 14.99,
            "category": "Data & Analytics",
            "image_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
            "stock_quantity": 50
        },
        {
            "name": "Compute Credits (1 GPU-Hour)",
            "description": "One hour of GPU compute on NVIDIA A100 for inference or training",
            "price": 12.99,
            "category": "Compute",
            "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475",
            "stock_quantity": 75
        },
        {
            "name": "Public Sentiment Dataset",
            "description": "Curated dataset of public sentiment analysis across social platforms",
            "price": 7.99,
            "category": "Data & Analytics",
            "image_url": "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3",
            "stock_quantity": 40
        },
        {
            "name": "Smart Contract Audit (Basic)",
            "description": "Automated security audit of Solana or EVM smart contracts under 500 LOC",
            "price": 19.99,
            "category": "Digital Services",
            "image_url": "https://images.unsplash.com/photo-1639762681485-074b7f938ba0",
            "stock_quantity": 25
        },
        # === Tier 3: $20.00 - $2000.00 (Verified agents) ===
        {
            "name": "Enterprise API Key (Monthly)",
            "description": "Dedicated API key with 1M requests/month, SLA guarantees, and analytics dashboard",
            "price": 49.99,
            "category": "Enterprise",
            "image_url": "https://images.unsplash.com/photo-1551434678-e076c223a692",
            "stock_quantity": 20
        },
        {
            "name": "Full Market Dataset (Annual)",
            "description": "Complete annual market dataset with historical trends across 50+ sectors",
            "price": 199.99,
            "category": "Enterprise",
            "image_url": "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74",
            "stock_quantity": 10
        },
        {
            "name": "Dedicated Compute Instance (Day)",
            "description": "24-hour dedicated GPU instance with 8x A100 GPUs and 1TB RAM",
            "price": 89.99,
            "category": "Compute",
            "image_url": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31",
            "stock_quantity": 5
        },
        {
            "name": "Custom ML Model Training",
            "description": "End-to-end custom ML model training with hyperparameter optimization and deployment",
            "price": 499.99,
            "category": "Compute",
            "image_url": "https://images.unsplash.com/photo-1677442136019-21780ecad995",
            "stock_quantity": 3
        },
        {
            "name": "Premium SLA Support Package",
            "description": "Enterprise support with 15-min response time, dedicated account manager, and 99.99% uptime SLA",
            "price": 999.99,
            "category": "Enterprise",
            "image_url": "https://images.unsplash.com/photo-1553877522-43269d4ea984",
            "stock_quantity": 5
        },
    ]
    
    # Check if products already exist
    existing_products = db.query(Product).count()
    if existing_products > 0:
        print(f"Database already has {existing_products} products. Skipping sample data creation.")
        db.close()
        return
    
    # Create products
    for product_data in sample_products:
        product = Product(**product_data)
        db.add(product)
    
    db.commit()
    print(f"Created {len(sample_products)} sample products")
    db.close()

if __name__ == "__main__":
    create_tables()
    create_sample_products()
