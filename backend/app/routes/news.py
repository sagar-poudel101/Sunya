import ssl
import urllib.request
import xml.etree.ElementTree as ET
import email.utils
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
import random

router = APIRouter(prefix="/api/news", tags=["news"])

def classify_news_category(title: str, content: str) -> str:
    combined = (title + " " + content).lower()
    
    if any(k in combined for k in ["law", "court", "act", "legal", "constitution", "police", "justice", "supreme", "commission", "rights", "prosecute", "verdict"]):
        return "Legal Rights"
        
    if any(k in combined for k in ["harass", "abuse", "assault", "violence", "discrimination", "safety", "sexual", "coercion"]):
        return "Workplace Protection"
        
    if any(k in combined for k in ["mentor", "lead", "career", "guidance", "opportunities", "education", "cooperatives", "development", "jobs", "employment", "entrepreneur", "business"]):
        return "Mentorship"
        
    return "Safety Tips"

def parse_relative_time(pub_date_str: str) -> str:
    try:
        # Google News date format is RFC 2822: e.g. "Sun, 19 Jul 2026 14:05:34 GMT"
        parsed_time = email.utils.parsedate_to_datetime(pub_date_str)
        now = datetime.now(timezone.utc)
        diff = now - parsed_time
        
        diff_secs = diff.total_seconds()
        if diff_secs < 60:
            return "Just now"
        elif diff_secs < 3600:
            minutes = int(diff_secs // 60)
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        elif diff_secs < 86400:
            hours = int(diff_secs // 3600)
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff_secs < 172800:
            return "Yesterday"
        else:
            days = int(diff_secs // 86400)
            return f"{days} days ago"
    except Exception:
        return "Recent"

@router.get("")
def get_live_news():
    url = "https://news.google.com/rss/search?q=women+nepal+(career+OR+harassment+OR+employment)&hl=en-NP&gl=NP&ceid=NP:en"
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    
    context = ssl._create_unverified_context()
    
    try:
        with urllib.request.urlopen(req, timeout=10, context=context) as response:
            xml_data = response.read()
        root = ET.fromstring(xml_data)
        
        posts = []
        for i, item in enumerate(root.findall('.//item')[:20]):
            title = item.find('title').text if item.find('title') is not None else ""
            link = item.find('link').text if item.find('link') is not None else ""
            pub_date_str = item.find('pubDate').text if item.find('pubDate') is not None else ""
            description = item.find('description').text if item.find('description') is not None else ""
            source = "News Source"
            
            clean_title = title
            if " - " in title:
                parts = title.split(" - ")
                clean_title = " - ".join(parts[:-1])
                source = parts[-1]
                
            category = classify_news_category(clean_title, description)
            time_str = parse_relative_time(pub_date_str)
            
            posts.append({
                "id": f"news-{i}",
                "author": source.strip(),
                "role": "News Article",
                "category": category,
                "time": time_str,
                "content": clean_title.strip(),
                "link": link,
                "likes": random.randint(10, 60),
                "comments": random.randint(1, 15),
                "isLiked": False
            })
            
        return {"success": True, "posts": posts}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch live feed news: {str(e)}"
        )
