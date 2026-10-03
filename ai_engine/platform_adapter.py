import logging
from typing import Dict, Any, List
from .gemini_client import get_gemini_model, is_gemini_configured, extract_json_from_response

logger = logging.getLogger("ai_engine.platform_adapter")

def adapt_content_for_platforms(
    title: str,
    summary: str,
    hook: str = "",
    transcript_text: str = ""
) -> Dict[str, Any]:
    """
    Generates tailored copy packages for Instagram Reels, YouTube Shorts, and LinkedIn.
    """
    if is_gemini_configured():
        try:
            logger.info("Adapting content for multiple platforms with Gemini...")
            model = get_gemini_model("gemini-1.5-flash")
            
            prompt = f"""
Given this video content:
- Title: {title}
- Hook: {hook}
- Summary: {summary}
- Context/Transcript: {transcript_text[:1000]}

Generate platform-specific distribution packages for Instagram Reels, YouTube Shorts, and LinkedIn.
Output MUST be valid JSON adhering strictly to:
{{
  "instagram": {{
    "title": "Short punchy title",
    "hook": "Scroll-stopping first line with emoji",
    "caption": "Engaging, conversational caption formatted with linebreaks for mobile reading...",
    "hashtags": ["#reels", "#creator", "#viral", "#tech", "#ai"]
  }},
  "youtube_shorts": {{
    "title": "High CTR Title (under 60 chars) #shorts",
    "short_description": "2 sentence high-impact summary",
    "description": "Full YouTube description with timestamps, key takeaways, and subscribe CTA...",
    "hashtags": ["#Shorts", "#YouTubeShorts", "#CreatorTips"]
  }},
  "linkedin": {{
    "opening_statement": "Thought-provoking professional statement or question...",
    "caption": "Structured business/industry insight with bullet points and clear takeaways...",
    "call_to_action": "Professional discussion prompt (e.g., 'What is your team's approach to...?')",
    "hashtags": ["#Productivity", "#Leadership", "#AITechnology", "#CreatorEconomy"]
  }}
}}
"""
            response = model.generate_content(prompt)
            return extract_json_from_response(response.text)
        except Exception as e:
            logger.warning(f"Gemini platform adaptation failed: {e}. Using rule-based adapter.")

    # Rule-based generator
    clean_title = title if title else "Creator AI Masterclass"
    clean_hook = hook if hook else "Stop wasting time doing video editing manually"
    
    return {
        "instagram": {
            "title": clean_title,
            "hook": f"⚡ {clean_hook}",
            "caption": f"⚡ {clean_hook}\n\nHere is how to automate your creative workflow:\n1️⃣ Capture high quality raw footage\n2️⃣ Let AI pinpoint viral clips with timestamps\n3️⃣ Auto-burn dynamic subtitles in 9:16 vertical\n\n👉 Follow @creatorai for daily workflows!",
            "hashtags": ["#ContentCreator", "#ReelsViral", "#VideoRepurposing", "#VideoEditing", "#AIWorkflow", "#CreativeHacks"]
        },
        "youtube_shorts": {
            "title": f"{clean_title} | 10x Your Creator Output #Shorts",
            "short_description": f"Master {clean_title} in 60 seconds with this automated creator blueprint.",
            "description": f"In this video, we break down {clean_title}.\n\n📌 Key Takeaways:\n- Automated highlight extraction\n- 9:16 aspect ratio optimization\n- Multi-platform repurposing\n\n🔔 Subscribe for more creator tools and AI tutorials!",
            "hashtags": ["#Shorts", "#YouTubeShorts", "#ContentStrategy", "#VideoProduction", "#AI"]
        },
        "linkedin": {
            "opening_statement": f"Content repurposing shouldn't consume 80% of a creator's week.",
            "caption": f"Content repurposing shouldn't consume 80% of a creator's week.\n\nWe analyzed how modern media teams scale their presence across video platforms without expanding headcount:\n\n• Centralize master video assets in one workspace\n• Extract high-retention segments programmatically\n• Tailor message nuances specifically for B2B vs consumer feeds\n\nThe future of media operations is AI-assisted, human-curated.",
            "call_to_action": "How is your team currently approaching multi-channel video distribution? Let's discuss below.",
            "hashtags": ["#CreatorEconomy", "#MarketingAutomation", "#DigitalStrategy", "#ArtificialIntelligence", "#Productivity"]
        }
    }
