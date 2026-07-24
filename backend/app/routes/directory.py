from fastapi import APIRouter

router = APIRouter(prefix="/api/directory", tags=["directory"])

DIRECTORY_DATA = [
    # --- LAWYERS ---
    {
        "id": "law-1",
        "name": "Advocate Meera Dhungana",
        "category": "lawyer",
        "role": "Senior Rights Advocate / President",
        "organization": "Forum for Women, Law and Development (FWLD)",
        "specialties": ["Workplace Harassment", "Gender Discrimination", "Civil Rights"],
        "location": "Kathmandu",
        "phone": "+977 1-4240627",
        "email": "info@fwld.org",
        "address": "Pragati Marg, Kopundole, Lalitpur",
        "languages": ["Nepali", "English"],
        "verified": True,
        "availability": "Free Legal Consultation"
    },
    {
        "id": "law-2",
        "name": "Advocate Roshana Shrestha",
        "category": "lawyer",
        "role": "Labor & Employment Specialist",
        "organization": "Nepal Legal Advocates & Associates",
        "specialties": ["Labor Law", "Contract Disputes", "Wage Theft Protection"],
        "location": "Lalitpur",
        "phone": "+977 9851023456",
        "email": "roshana@nepallegal.com",
        "address": "Hariharbhawan, Lalitpur",
        "languages": ["Nepali", "English", "Newari"],
        "verified": True,
        "availability": "Paid Consultation (Sliding Scale)"
    },
    {
        "id": "law-3",
        "name": "Advocate Sabin Shrestha",
        "category": "lawyer",
        "role": "Cyber & Gender Rights Expert",
        "organization": "FWLD Legal Aid Registry",
        "specialties": ["Cyber Law / Online Harassment", "Privacy Violations", "Gender Rights"],
        "location": "Kathmandu",
        "phone": "+977 1-4242627",
        "email": "sabin@fwld.org",
        "address": "Kopundole, Lalitpur",
        "languages": ["Nepali", "English"],
        "verified": True,
        "availability": "Free Legal Aid"
    },
    {
        "id": "law-4",
        "name": "Legal Aid & Consultancy Center (LACC)",
        "category": "lawyer",
        "role": "Women's Legal Aid Organization",
        "organization": "LACC Nepal",
        "specialties": ["Gender-Based Coercion", "Family Law", "Court Representation Support"],
        "location": "Lalitpur",
        "phone": "+977 1-5543111",
        "email": "lacc@wlink.com.np",
        "address": "Pramod Marg, Sanepa, Lalitpur",
        "languages": ["Nepali", "English"],
        "verified": True,
        "availability": "Free for Marginalized Groups"
    },
    
    # --- COUNSELORS / PSYCHIATRIC ---
    {
        "id": "coun-1",
        "name": "TPO Nepal Psychosocial Support",
        "category": "counsellor",
        "role": "National Mental Health Help Center",
        "organization": "Transcultural Psychosocial Organization (TPO)",
        "specialties": ["Trauma Counseling", "Crisis Intervention", "Workplace Stress", "Depression Support"],
        "location": "Kathmandu (Tele-counseling available)",
        "phone": "16600102005",  # Toll Free Helpline
        "email": "info@tponepal.org",
        "address": "Baluwatar, Kathmandu",
        "languages": ["Nepali", "English"],
        "verified": True,
        "availability": "Free Toll-Free Support (Toll-Free Helpline)"
    },
    {
        "id": "coun-2",
        "name": "Dr. Karuna Kunwar",
        "category": "counsellor",
        "role": "Senior Clinical Psychologist & Trauma Specialist",
        "organization": "Mindfulness Counseling & Care Center",
        "specialties": ["Trauma Recovery", "Gender-Based Violence Support", "Anxiety & Burnout"],
        "location": "Kathmandu",
        "phone": "+977 9801123490",
        "email": "karuna.kunwar@gmail.com",
        "address": "Maharajgunj, Kathmandu",
        "languages": ["Nepali", "English"],
        "verified": True,
        "availability": "By Appointment (Paid)"
    },
    {
        "id": "coun-3",
        "name": "WOREC Nepal Counseling Desk",
        "category": "counsellor",
        "role": "Women Rehabilitation & Crisis Counsel Center",
        "organization": "Women's Rehabilitation Center (WOREC)",
        "specialties": ["Abuse & Coercion Support", "Shelter & Safety Counseling", "Psychosocial Support"],
        "location": "Lalitpur",
        "phone": "+977 1-5186071",
        "email": "counseling@worecnepal.org",
        "address": "Balkumari, Lalitpur",
        "languages": ["Nepali", "English", "Maithili"],
        "verified": True,
        "availability": "Free Safe Helpline Support"
    },
    {
        "id": "coun-4",
        "name": "Koshish Mental Health Clinic",
        "category": "counsellor",
        "role": "Community Psychosocial Care Center",
        "organization": "Koshish Nepal",
        "specialties": ["Workplace Stress", "Crisis Management", "Self-help & Mindfulness"],
        "location": "Pokhara",
        "phone": "+977 61-460111",
        "email": "koshish.pokhara@koshishnepal.org",
        "address": "Srijanachowk, Pokhara",
        "languages": ["Nepali", "English"],
        "verified": True,
        "availability": "Free/Subsidized Counseling"
    }
]

@router.get("")
def get_verified_support_directory():
    return {"success": True, "directory": DIRECTORY_DATA}