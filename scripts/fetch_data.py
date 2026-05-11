#!/usr/bin/env python3
"""
Daily Financial Market Data Fetcher
Uses yfinance (free) to fetch market data and generates JSON data files for the frontend.
"""

import json
import math
import os
import sys
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any


def _safe_pct(data: Dict[str, Any], key: str = "changePercent", default: float = 0.0) -> float:
    """Safely extract a percentage value, treating NaN as default."""
    val = data.get(key, default)
    if isinstance(val, float) and math.isnan(val):
        return default
    return val if val is not None else default

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

INDICES = [
    {"name": "道琼斯工业平均指数", "nameEn": "Dow Jones Industrial Average", "symbol": "^DJI", "region": "United States"},
    {"name": "标普500指数", "nameEn": "S&P 500", "symbol": "^GSPC", "region": "United States"},
    {"name": "纳斯达克综合指数", "nameEn": "Nasdaq Composite", "symbol": "^IXIC", "region": "United States"},
    {"name": "日经225指数", "nameEn": "Nikkei 225", "symbol": "^N225", "region": "Japan"},
    {"name": "韩国综合股价指数", "nameEn": "KOSPI", "symbol": "^KS11", "region": "South Korea"},
]

# Approximate constituent weights for top contributors calculation
INDEX_CONSTITUENTS: Dict[str, List[Dict[str, Any]]] = {
    "^DJI": [
        {"symbol": "UNH", "name": "联合健康集团", "nameEn": "UnitedHealth Group", "weight": 0.088, "sector": "医疗保健"},
        {"symbol": "GS", "name": "高盛集团", "nameEn": "Goldman Sachs", "weight": 0.082, "sector": "金融服务"},
        {"symbol": "MSFT", "name": "微软", "nameEn": "Microsoft", "weight": 0.065, "sector": "科技"},
        {"symbol": "HD", "name": "家得宝", "nameEn": "Home Depot", "weight": 0.062, "sector": "零售"},
        {"symbol": "AMGN", "name": "安进", "nameEn": "Amgen", "weight": 0.055, "sector": "生物科技"},
        {"symbol": "CAT", "name": "卡特彼勒", "nameEn": "Caterpillar", "weight": 0.045, "sector": "工业机械"},
        {"symbol": "MCD", "name": "麦当劳", "nameEn": "McDonald's", "weight": 0.042, "sector": "餐饮"},
        {"symbol": "V", "name": "Visa", "nameEn": "Visa", "weight": 0.040, "sector": "支付"},
        {"symbol": "JPM", "name": "摩根大通", "nameEn": "JPMorgan Chase", "weight": 0.038, "sector": "金融服务"},
        {"symbol": "BA", "name": "波音", "nameEn": "Boeing", "weight": 0.035, "sector": "航空航天"},
        {"symbol": "AAPL", "name": "苹果", "nameEn": "Apple", "weight": 0.033, "sector": "科技"},
        {"symbol": "CRM", "name": "Salesforce", "nameEn": "Salesforce", "weight": 0.032, "sector": "SaaS"},
        {"symbol": "TRV", "name": "旅行者保险", "nameEn": "Travelers", "weight": 0.028, "sector": "保险"},
        {"symbol": "AXP", "name": "美国运通", "nameEn": "American Express", "weight": 0.027, "sector": "金融服务"},
        {"symbol": "IBM", "name": "IBM", "nameEn": "IBM", "weight": 0.026, "sector": "科技"},
    ],
    "^N225": [
        {"symbol": "9984.T", "name": "软银集团", "nameEn": "SoftBank Group", "weight": 0.084, "sector": "投资控股"},
        {"symbol": "8035.T", "name": "东京电子", "nameEn": "Tokyo Electron", "weight": 0.045, "sector": "半导体设备"},
        {"symbol": "6861.T", "name": "基恩士", "nameEn": "Keyence", "weight": 0.060, "sector": "工业自动化"},
        {"symbol": "9983.T", "name": "迅销", "nameEn": "Fast Retailing", "weight": 0.085, "sector": "零售"},
        {"symbol": "6857.T", "name": "爱德万测试", "nameEn": "Advantest", "weight": 0.031, "sector": "半导体设备"},
        {"symbol": "4063.T", "name": "信越化学", "nameEn": "Shin-Etsu Chemical", "weight": 0.028, "sector": "化工材料"},
        {"symbol": "4502.T", "name": "武田药品", "nameEn": "Takeda Pharmaceutical", "weight": 0.025, "sector": "制药"},
        {"symbol": "4568.T", "name": "第一三共", "nameEn": "Daiichi Sankyo", "weight": 0.022, "sector": "制药"},
        {"symbol": "6146.T", "name": "迪思科", "nameEn": "DISCO", "weight": 0.020, "sector": "半导体设备"},
        {"symbol": "6752.T", "name": "松下", "nameEn": "Panasonic", "weight": 0.018, "sector": "电子"},
    ],
    "^KS11": [
        {"symbol": "005930.KS", "name": "三星电子", "nameEn": "Samsung Electronics", "weight": 0.168, "sector": "半导体"},
        {"symbol": "000660.KS", "name": "SK海力士", "nameEn": "SK Hynix", "weight": 0.072, "sector": "半导体"},
        {"symbol": "005380.KS", "name": "现代汽车", "nameEn": "Hyundai Motor", "weight": 0.055, "sector": "汽车"},
        {"symbol": "207940.KS", "name": "三星生物制剂", "nameEn": "Samsung Biologics", "weight": 0.035, "sector": "生物科技"},
        {"symbol": "373220.KS", "name": "LG新能源", "nameEn": "LG Energy Solution", "weight": 0.030, "sector": "电池"},
        {"symbol": "051910.KS", "name": "LG化学", "nameEn": "LG Chem", "weight": 0.025, "sector": "化工"},
        {"symbol": "006400.KS", "name": "三星SDI", "nameEn": "Samsung SDI", "weight": 0.022, "sector": "电池"},
        {"symbol": "035420.KS", "name": "NAVER", "nameEn": "NAVER", "weight": 0.020, "sector": "互联网"},
    ],
}

# Sector-based analysis templates
SECTOR_ANALYSIS: Dict[str, Dict[str, List[str]]] = {
    "半导体": {
        "up": [
            "AI算力需求持续爆发，芯片订单排产至2027年",
            "先进制程产能利用率维持满载，ASP持续上行",
            "全球数据中心资本开支超预期增长",
        ],
        "down": [
            "下游消费电子库存调整，短期需求疲软",
            "成熟制程价格战压缩毛利率",
            "地缘政治风险导致部分订单延迟",
        ],
    },
    "半导体设备": {
        "up": [
            "晶圆厂扩产周期持续，设备订单创历史新高",
            "AI芯片对先进制程需求拉动设备投资",
            "国产替代加速，本土设备商份额提升",
        ],
        "down": [
            "晶圆厂资本开支周期进入调整期",
            "设备交付周期缩短，订单增速放缓",
            "存储厂商减产影响设备需求",
        ],
    },
    "科技": {
        "up": [
            "AI应用商业化加速，云业务增长强劲",
            "企业数字化转型需求持续释放",
            "新产品发布带动市场乐观预期",
        ],
        "down": [
            "反垄断监管压力加大",
            "云业务增速放缓，市场担忧估值回调",
            "宏观经济下行影响企业IT支出",
        ],
    },
    "金融服务": {
        "up": [
            "利率上行环境利好净息差扩张",
            "投行业务回暖，IPO和并购活动增加",
            "资产质量改善，坏账率持续下降",
        ],
        "down": [
            "利率预期下行压缩净息差空间",
            "经济衰退担忧导致信贷需求疲软",
            "市场波动加大，交易收入承压",
        ],
    },
    "投资控股": {
        "up": [
            "旗下核心资产估值修复，投资组合增值",
            "AI生态布局进入收获期",
            "资本市场活跃度提升，退出渠道畅通",
        ],
        "down": [
            "投资组合估值回调，未实现收益下降",
            "科技板块估值压缩影响投资收益",
            "宏观经济不确定性增加投资难度",
        ],
    },
    "汽车": {
        "up": [
            "电动车销量持续增长，市场份额扩大",
            "电池成本下降推动盈利能力改善",
            "新兴市场需求旺盛，出口增长强劲",
        ],
        "down": [
            "原材料价格上涨压缩整车毛利率",
            "传统燃油车销量下滑拖累整体业绩",
            "补贴政策退坡影响消费者购车意愿",
        ],
    },
    "工业机械": {
        "up": [
            "基建投资加速拉动工程机械需求",
            "矿业资本开支周期上行",
            "新能源项目带动设备采购",
        ],
        "down": [
            "全球贸易紧张局势影响设备出口",
            "大宗商品价格波动反映需求放缓",
            "制造业PMI下滑预示资本开支收缩",
        ],
    },
    "医疗保健": {
        "up": [
            "老龄化趋势推动医疗需求刚性增长",
            "创新药管线进入收获期",
            "医保覆盖扩大提升药品可及性",
        ],
        "down": [
            "医保控费政策压缩药品定价空间",
            "集采政策影响仿制药利润",
            "研发管线不及预期",
        ],
    },
    "零售": {
        "up": [
            "消费复苏带动同店销售增长",
            "数字化转型提升运营效率",
            "新兴市场扩张贡献增量收入",
        ],
        "down": [
            "消费降级趋势影响客单价",
            "电商竞争加剧分流线下客流",
            "通胀压力侵蚀消费者购买力",
        ],
    },
    "电池": {
        "up": [
            "电动车渗透率提升拉动电池需求",
            "储能市场爆发打开第二增长曲线",
            "固态电池技术突破提振行业信心",
        ],
        "down": [
            "原材料价格波动影响成本结构",
            "产能过剩导致价格战",
            "技术路线分歧增加投资风险",
        ],
    },
}

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join(os.path.dirname(__file__), "fetch_data.log"), encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def now_shanghai() -> str:
    """Return current timestamp in Shanghai timezone (UTC+8)."""
    tz = timezone(timedelta(hours=8))
    return datetime.now(tz).strftime("%Y-%m-%dT%H:%M:%S+08:00")


def safe_float(val, default=0.0) -> float:
    """Safely convert a value to float, returning default on failure."""
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


def write_json(path: str, data: dict) -> None:
    """Write a JSON file atomically (to avoid corrupting existing files on error)."""
    tmp_path = path + ".tmp"
    try:
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp_path, path)
        logger.info(f"Written: {path}")
    except Exception as e:
        logger.error(f"Failed to write {path}: {e}")
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise


# ---------------------------------------------------------------------------
# Data Fetching
# ---------------------------------------------------------------------------
def fetch_index_data() -> list:
    """Fetch OHLC data for all configured indices via yfinance."""
    try:
        import yfinance as yf
    except ImportError:
        logger.error("yfinance not installed. Run: pip install yfinance>=0.2.28")
        raise

    results = []
    for idx_info in INDICES:
        symbol = idx_info["symbol"]
        logger.info(f"Fetching {symbol} ...")
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            hist = ticker.history(period="2d")

            if hist.empty or len(hist) < 1:
                logger.warning(f"No historical data for {symbol}")
                continue

            # Latest bar
            latest = hist.iloc[-1]
            previous_close = info.get("previousClose") or info.get("regularMarketPreviousClose")

            # If previousClose is missing, use the prior day's close
            if previous_close is None and len(hist) >= 2:
                previous_close = float(hist.iloc[-2]["Close"])

            open_price = float(latest["Open"])
            high_price = float(latest["High"])
            low_price = float(latest["Low"])
            close_price = float(latest["Close"])
            previous_close = safe_float(previous_close, close_price)

            change = round(close_price - previous_close, 2)
            change_percent = round((change / previous_close) * 100, 2) if previous_close else 0.0
            trend = "up" if change >= 0 else "down"

            results.append({
                "name": idx_info["name"],
                "nameEn": idx_info["nameEn"],
                "symbol": symbol,
                "region": idx_info["region"],
                "open": round(open_price, 2),
                "high": round(high_price, 2),
                "low": round(low_price, 2),
                "close": round(close_price, 2),
                "previousClose": round(previous_close, 2),
                "change": change,
                "changePercent": change_percent,
                "trend": trend,
            })
            logger.info(f"  {symbol}: {close_price} ({change_percent:+.2f}%)")

        except Exception as e:
            logger.error(f"Error fetching {symbol}: {e}")
            # Continue with other indices
            continue

    return results


def fetch_stock_changes(symbols: List[str]) -> Dict[str, Dict[str, Any]]:
    """Fetch price changes for a list of stock symbols."""
    try:
        import yfinance as yf
    except ImportError:
        logger.error("yfinance not installed.")
        return {}

    results = {}
    for symbol in symbols:
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="2d")
            if hist.empty or len(hist) < 2:
                logger.warning(f"No historical data for {symbol}")
                continue

            latest = hist.iloc[-1]
            previous = hist.iloc[-2]
            close = float(latest["Close"])
            prev_close = float(previous["Close"])
            change = round(close - prev_close, 2)
            change_percent = round((change / prev_close) * 100, 2) if prev_close else 0.0

            results[symbol] = {
                "close": close,
                "change": change,
                "changePercent": change_percent,
            }
            logger.info(f"  {symbol}: {close:.2f} ({change_percent:+.2f}%)")
        except Exception as e:
            logger.warning(f"Error fetching {symbol}: {e}")
            continue

    return results


def get_sector_analysis(sector: str, change: float) -> List[str]:
    """Get analysis text for a given sector and price change direction."""
    direction = "up" if change >= 0 else "down"
    templates = SECTOR_ANALYSIS.get(sector, SECTOR_ANALYSIS.get("科技", {}))
    return templates.get(direction, ["市场情绪推动股价波动", "行业基本面保持稳定", "短期交易因素主导走势"])


def calculate_contributors(index_symbol: str, index_data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate top contributors for a given index based on real-time stock data."""
    constituents = INDEX_CONSTITUENTS.get(index_symbol, [])
    if not constituents:
        logger.warning(f"No constituent data for {index_symbol}")
        return None

    symbols = [c["symbol"] for c in constituents]
    stock_data = fetch_stock_changes(symbols)

    # Calculate contribution for each stock
    contributors = []
    for c in constituents:
        symbol = c["symbol"]
        data = stock_data.get(symbol)
        if not data:
            continue

        change_percent = data["changePercent"]
        weight = c["weight"]
        # Approximate contribution = weight * changePercent
        contribution = weight * change_percent

        contributors.append({
            "symbol": symbol,
            "name": c["name"],
            "nameEn": c["nameEn"],
            "changePercent": change_percent,
            "weight": f"~{weight*100:.1f}%",
            "contribution": round(contribution, 2),
            "sector": c["sector"],
            "analysis": get_sector_analysis(c["sector"], change_percent),
        })

    if not contributors:
        return None

    # Sort by absolute contribution (most impactful first)
    contributors.sort(key=lambda x: abs(x["contribution"]), reverse=True)

    # Take top 3 and add rank
    top3 = contributors[:3]
    total_abs_contribution = sum(abs(c["contribution"]) for c in top3)

    for i, c in enumerate(top3):
        c["rank"] = i + 1
        c["contributionShare"] = f"~{abs(c['contribution'])/total_abs_contribution*100:.1f}%" if total_abs_contribution else "~0%"
        # Format contribution string
        contrib_val = c["contribution"]
        c["contribution"] = f"{'+' if contrib_val >= 0 else ''}{contrib_val:.1f}点"

    index_names = {
        "^DJI": ("道琼斯工业平均指数", "Dow Jones Industrial Average"),
        "^N225": ("日经225", "Nikkei 225"),
        "^KS11": ("韩国综合股价指数", "KOSPI"),
    }
    name, nameEn = index_names.get(index_symbol, (index_symbol, index_symbol))

    return {
        "indexName": name,
        "indexSymbol": index_symbol,
        "date": datetime.now(timezone(timedelta(hours=8))).strftime("%Y-%m-%d"),
        "topContributors": top3,
    }


def get_leaders_data(indices_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Generate dynamic leaders data based on real-time market data."""
    results = []
    index_map = {idx["symbol"]: idx for idx in indices_data}

    for symbol in ["^DJI", "^N225", "^KS11"]:
        if symbol in index_map:
            contributor_data = calculate_contributors(symbol, index_map[symbol])
            if contributor_data:
                results.append(contributor_data)

    return results


SUPERCYCLE_ARG_TEMPLATES = {
    "hbm": {
        "hot":   "HBM新闻热度极高，本周{count}条相关报道。从HBM2E到HBM3E再到HBM4，每一代堆叠层数翻倍，带宽提升40%以上。SK海力士凭借与NVIDIA的深度绑定，建立了难以逾越的技术护城河。",
        "normal": "HBM成为AI计算性能瓶颈与价值核心。SK海力士凭借与NVIDIA的深度绑定，建立了难以逾越的技术护城河，三星正全力追赶。",
        "cool":   "HBM市场进入相对平稳期。SK海力士维持市占率领先，行业焦点转向HBM4量产进度。",
    },
    "capex": {
        "hot":    "本周共{count}条CSP资本开支新闻，云厂商投资竞赛白热化。微软、亚马逊、谷歌2026年AI基建投资超过8,300亿美元，同比增长79%。",
        "normal": "全球九大CSP资本支出维持高位，2026年AI基建投资预计超8,300亿美元，同比增长79%。",
        "cool":   "CSP资本开支预期趋稳，市场关注从投入转向产出。",
    },
}


def _pick_arg(theme_key: str, news_count: int) -> str:
    bucket = "hot" if news_count >= 3 else "normal" if news_count >= 1 else "cool"
    tmpl = SUPERCYCLE_ARG_TEMPLATES[theme_key][bucket]
    return tmpl.format(count=news_count)


GEO_LEFT_TEMPLATES = {
    "high": {
        "title": "贸易摩擦升级",
        "content": "本周地缘相关新闻{count}条，关税与出口管制成为市场焦点。美国可能进一步加征汽车/半导体关税，中国半导体自主化加速。",
        "impacts": [
            "关税不确定性：对道指工业股构成阶段性压力",
            "供应链区域化：东亚半导体产业链地位进一步强化",
            "技术封锁：倒逼中国半导体自主化进程加速",
            "全球资本流向避险资产",
        ],
    },
    "medium": {
        "title": "贸易摩擦与供应链重构",
        "content": "地缘相关新闻{count}条，关税政策仍有不确定性，但日韩与AI供应链关系紧密，相对免疫。中国半导体自主化持续推进。",
        "impacts": [
            "关税不确定性：对道指工业股构成阶段性压力",
            "供应链区域化：东亚半导体产业链地位进一步强化",
            "技术封锁：倒逼中国半导体自主化进程加速",
        ],
    },
    "low": {
        "title": "供应链重构",
        "content": "近期地缘新闻较少，市场关注点转向基本面。东亚半导体产业链地位稳固，中国半导体自主化长期推进中。",
        "impacts": [
            "供应链区域化：东亚半导体产业链地位进一步强化",
            "技术自主：中国半导体自主化进程稳步推进",
        ],
    },
}


def _build_geo_left(news_highlights: Dict[str, List[Dict[str, str]]]) -> Dict[str, Any]:
    cnt = len(news_highlights.get("地缘/关税", []))
    bucket = "high" if cnt >= 3 else "medium" if cnt >= 1 else "low"
    t = GEO_LEFT_TEMPLATES[bucket]
    return {
        "title": t["title"],
        "content": t["content"].format(count=cnt),
        "impacts": t["impacts"],
    }


def generate_llm_analysis(indices_data: List[Dict[str, Any]], news_highlights: Dict[str, List[Dict[str, str]]], layer_title: str = None) -> str | None:
    """Use Moonshot AI (Kimi) to generate a dynamic analysis paragraph."""
    api_key = os.getenv("MOONSHOT_API_KEY")
    if not api_key:
        return None
    try:
        from openai import OpenAI
    except ImportError:
        logger.warning("openai not installed, skipping LLM analysis")
        return None

    client = OpenAI(api_key=api_key, base_url="https://api.moonshot.cn/v1")
    news_text = "\n".join([
        f"- [{theme}] {n['title']}"
        for theme, items in news_highlights.items()
        for n in items
    ]) or "暂无近期新闻"
    market_text = "\n".join([
        f"- {i['name']}: {i['changePercent']:+.2f}% (close {i['close']})"
        for i in indices_data
    ])
    target = layer_title or "全球AI半导体宏观格局"
    prompt = f"""你是资深金融分析师。基于以下实时数据，为"{target}"撰写一段150字以内的中文分析，要求引用具体新闻和数据点，语言专业凝练。

[今日行情]
{market_text}

[过去48小时关键新闻]
{news_text}

只输出分析正文，不要标题、不要引言、不要总结性套话。
"""
    try:
        resp = client.chat.completions.create(
            model="moonshot-v1-8k",
            max_tokens=400,
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}],
        )
        text = resp.choices[0].message.content.strip()
        logger.info(f"LLM analysis generated for '{target}' ({len(text)} chars)")
        return text
    except Exception as e:
        logger.warning(f"LLM analysis failed: {e}")
        return None


def get_macro_data(indices_data: List[Dict[str, Any]], news_highlights: Dict[str, List[Dict[str, str]]] = None) -> Dict[str, Any]:
    """Generate dynamic macro data based on real-time market data.
    Returns structure compatible with the frontend Macro.tsx component."""
    news_highlights = news_highlights or {}
    index_map = {idx["symbol"]: idx for idx in indices_data}

    us_indices = [idx for idx in indices_data if idx["region"] == "United States"]
    nikkei = index_map.get("^N225", {})
    kospi = index_map.get("^KS11", {})

    # Determine market trend summary
    us_avg_change = sum(_safe_pct(idx) for idx in us_indices) / len(us_indices) if us_indices else 0
    nikkei_change = _safe_pct(nikkei)
    kospi_change = _safe_pct(kospi)

    # News-driven dynamic args
    hbm_count = len(news_highlights.get("HBM/存储", []))
    capex_count = len(news_highlights.get("AI Capex", []))

    asia_up = nikkei_change >= 0 and kospi_change >= 0
    us_up = us_avg_change >= 0

    if asia_up and us_up:
        summary = "全球市场同步上涨，风险偏好全面回升，AI产业链引领涨势"
    elif asia_up and not us_up:
        summary = "亚洲市场领涨，美股相对疲软，资金持续向AI硬科技产业链集中配置"
    elif not asia_up and us_up:
        summary = "美股表现稳健，亚洲市场短期调整，全球分化格局延续"
    else:
        summary = "全球主要市场同步回调，避险情绪升温，短期获利回吐压力显现"

    # Dynamic geopolitics summary
    if asia_up and us_up:
        geo_summary = "全球资本市场风险偏好同步回升，AI超级周期成为跨市场主线叙事。"
    elif asia_up and not us_up:
        geo_summary = "资金从美股向亚洲AI产业链转移，全球资本再配置加速。"
    elif not asia_up and us_up:
        geo_summary = "美股韧性显现，亚洲市场进入阶段性整固，中长期向上逻辑未变。"
    else:
        geo_summary = "全球市场同步承压，建议关注回调后的布局机会。"

    result = {
        "summary": summary,
        "ringNodes": {
            "center": {"label": "AI芯片", "r": 50},
            "inner": [
                {"label": "设计", "sub": "NVIDIA / AMD", "angle": -90},
                {"label": "存储", "sub": "SK海力士 / 三星", "angle": 30},
                {"label": "设备", "sub": "东京电子 / 爱德万", "angle": 150},
            ],
            "outer": [
                {"label": "微软", "sub": "Azure", "angle": -30},
                {"label": "亚马逊", "sub": "AWS", "angle": 90},
                {"label": "谷歌", "sub": "GCP", "angle": 210},
            ],
        },
        "supercycle": {
            "arguments": [
                {
                    "title": "算力需求呈指数级增长",
                    "content": f"全球九大CSP资本支出维持高位，AI芯片需求持续强劲。当前道指{us_avg_change:+.2f}%、日经{nikkei_change:+.2f}%、KOSPI{kospi_change:+.2f}%的收盘表现，反映市场对AI产业链的信心分化。",
                },
                {
                    "title": "HBM成为性能瓶颈与价值核心",
                    "content": _pick_arg("hbm", hbm_count),
                },
                {
                    "title": "CSP资本支出创历史纪录",
                    "content": _pick_arg("capex", capex_count),
                },
            ],
            "stats": [
                {"value": "8,300亿", "label": "美元CSP资本支出"},
                {"value": "+79%", "label": "同比增幅"},
                {"value": "57-62%", "label": "SK海力士HBM市占率"},
            ],
        },
        "geopolitics": {
            "leftColumn": _build_geo_left(news_highlights),
            "rightColumn": {
                "title": "美联储与全球流动性",
                "content": "市场对美联储政策预期持续影响全球资本流动。美元指数波动直接影响出口型企业盈利预期和跨国资本配置。",
                "data": [
                    {"value": f"{us_avg_change:+.2f}%", "label": "美股平均涨跌幅", "color": "rise-green" if us_avg_change >= 0 else "fall-red"},
                    {"value": f"{nikkei_change:+.2f}%", "label": "日经225", "color": "rise-green" if nikkei_change >= 0 else "fall-red"},
                    {"value": f"{kospi_change:+.2f}%", "label": "KOSPI", "color": "rise-green" if kospi_change >= 0 else "fall-red"},
                ],
            },
            "summary": geo_summary,
        },
        "capex": {
            "total": 8300,
            "unit": "亿美元",
            "description": "2026年全球九大CSP（云服务提供商）AI相关资本支出预计达到8,300亿美元，这一数字相当于2024年全球半导体总产值的1.5倍。",
            "data": [
                {"name": "Amazon", "value": 2300, "color": "#C9A962", "desc": "AWS基础设施+自研芯片"},
                {"name": "Microsoft", "value": 1900, "color": "#E8D5A3", "desc": "Azure+OpenAI合作"},
                {"name": "Google", "value": 1850, "color": "#B0B0B0", "desc": "GCP+TPU生态"},
                {"name": "Meta", "value": 1350, "color": "#8B7355", "desc": "AI算力中心"},
                {"name": "Oracle", "value": 800, "color": "#6A6A6A", "desc": "云基础设施扩张"},
                {"name": "Tesla/xAI", "value": 500, "color": "#4A4A4A", "desc": "Dojo超算+自动驾驶"},
                {"name": "Apple", "value": 450, "color": "#3A3A3A", "desc": "Apple Intelligence"},
                {"name": "NVIDIA", "value": 400, "color": "#2A2A2A", "desc": "内部计算集群"},
            ],
            "trend": {
                "title": "资本支出趋势",
                "content": f"当前市场环境下，云厂商资本支出增速与股价表现出现分化。道指{us_avg_change:+.2f}%、日经{nikkei_change:+.2f}%、KOSPI{kospi_change:+.2f}%的收盘数据表明，资金正在从纯粹的概念炒作向有实际订单支撑的设备商和存储商集中。",
            },
            "conclusion": "云服务商的8,300亿美元资本支出是整个产业链的终端买单方，它们的支出决定上游所有环节的需求强度。当前正处于资本开支扩张周期的中段，设备商和存储商将是最确定的受益者。",
        },
    }

    # Override summary with LLM-generated text if available
    llm_summary = generate_llm_analysis(indices_data, news_highlights)
    if llm_summary:
        result["summary"] = llm_summary
        result["llmGenerated"] = True

    return result


# ---------------------------------------------------------------------------
# Chain Analysis (news-driven dynamic descriptions)
# ---------------------------------------------------------------------------

CHAIN_LAYER_CONFIG: List[Dict[str, Any]] = [
    {
        "id": "01",
        "title": "芯片设计",
        "short": "设计",
        "symbols": ["NVDA", "AMD"],
        "companies": [
            {"name": "NVIDIA", "label": "AI计算霸主", "highlight": True},
            {"name": "AMD", "label": "追赶者", "highlight": False},
        ],
        "marketSize": "AI芯片市场: 1,800亿美元",
        "templates": {
            "up": [
                "NVIDIA凭借Blackwell架构和CUDA生态持续巩固AI训练市场主导地位，AMD通过MI350系列在推理市场取得突破。最新新闻显示AI芯片需求持续强劲，设计层景气度维持高位。",
                "云厂商数据中心扩张拉动高端GPU需求，NVIDIA和AMD订单排产至2027年。新闻提及AI芯片瓶颈仍是市场关注焦点，设计层成为产业链最确定的受益环节。",
                "AI推理需求爆发式增长，NVIDIA在数据中心GPU领域保持绝对领先，AMD MI350系列获得云厂商大量订单。设计层技术创新速度正在加快。",
            ],
            "down": [
                "市场对AI芯片需求增速放缓的担忧升温，部分投资者担心数据中心资本开支周期见顶。NVIDIA和AMD股价高位回调，设计层短期承压。",
                "下游客户库存调整导致高端GPU订单增速放缓，NVIDIA和AMD面临季节性需求波动。设计层进入阶段性整理。",
            ],
            "neutral": [
                "AI芯片市场进入季节性调整期，NVIDIA和AMD股价高位震荡。新闻显示市场对下一代产品发布充满期待，设计层等待新催化。",
                "芯片设计层竞争格局稳定，NVIDIA维持CUDA生态优势，AMD在推理市场稳步推进。行业关注焦点转向下一代架构的能效比提升。",
            ],
        },
        "keywords": ["AI chip", "Blackwell", "CUDA", "inference", "training", "GPU", "data center", "Nvidia", "AMD"],
    },
    {
        "id": "02",
        "title": "HBM存储",
        "short": "存储",
        "symbols": ["000660.KS", "005930.KS", "MU"],
        "companies": [
            {"name": "SK海力士", "label": "市占率57-62%", "highlight": True},
            {"name": "三星电子", "label": "追赶者", "highlight": False},
            {"name": "美光", "label": "~10%", "highlight": False},
        ],
        "stats": [
            {"value": "57-62%", "label": "SK海力士市占率"},
            {"value": "79%", "label": "SK海力士毛利率"},
        ],
        "templates": {
            "up": [
                "HBM供应持续紧张，SK海力士凭借与NVIDIA的深度绑定维持技术领先。最新新闻显示AI内存价格持续上行，HBM3E和即将量产的HBM4推动存储厂商毛利率扩张，存储层成为AI产业链的瓶颈与价值核心。",
                "AI boom驱动存储芯片需求激增，SK海力士和三星加速HBM产能扩张。新闻提及memory price surge，存储层景气度处于历史高位。",
                "HBM技术迭代加速，从HBM2E到HBM3E再到HBM4，每一代堆叠层数翻倍。SK海力士率先量产能力建立了难以逾越的技术护城河，三星正全力追赶。",
            ],
            "down": [
                "存储芯片价格回落担忧浮现，部分下游客户库存调整导致HBM订单增速放缓。SK海力士和三星面临短期需求波动，存储层承压。",
                "市场对HBM产能过剩的担忧升温，三星大幅扩产可能改变供需格局。存储层进入价格博弈期，SK海力士毛利率面临压缩压力。",
            ],
            "neutral": [
                "HBM市场供需趋于平衡，SK海力士与三星竞争加剧。新闻显示memory市场进入平稳期，等待HBM4量产带来新一轮增长。",
                "存储层技术迭代持续推进，SK海力士维持高市占率，三星加速追赶。行业关注焦点转向HBM4的量产进度和产能爬坡。",
            ],
        },
        "keywords": ["HBM", "memory", "supply", "shortage", "price", "DDR", "SK Hynix", "Samsung", "Micron", "storage"],
    },
    {
        "id": "03",
        "title": "半导体设备",
        "short": "设备",
        "symbols": ["8035.T", "6857.T", "ASML", "AMAT"],
        "companies": [
            {"name": "东京电子", "label": "刻蚀龙头", "highlight": True},
            {"name": "爱德万测试", "label": "测试核心", "highlight": True},
            {"name": "ASML", "label": "光刻垄断", "highlight": False},
            {"name": "Applied Materials", "label": "沉积巨头", "highlight": False},
        ],
        "stats": [
            {"value": "#1", "label": "东京电子刻蚀市占率"},
            {"value": "#1", "label": "爱德万SoC测试市占率"},
        ],
        "templates": {
            "up": [
                "晶圆厂扩产周期持续，东京电子和爱德万测试订单创历史新高。最新新闻显示AI芯片产能扩张拉动设备投资，设备层是AI芯片量产的前提条件。",
                "先进制程复杂度提升驱动设备需求，KLA和东京电子在检测与刻蚀领域持续 gain share。每一座先进制程晶圆厂需要投资150-200亿美元设备，设备商技术壁垒进一步巩固。",
                "ASML先进光刻机交付加速，推动3nm及以下制程产能爬坡。设备层迎来扩产与升级双重驱动，东京电子和爱德万是最确定的受益者。",
            ],
            "down": [
                "晶圆厂资本开支预期下调，设备交付周期缩短，设备层订单增速面临放缓压力。东京电子和爱德万测试短期承压。",
                "存储厂商减产影响设备需求，部分晶圆厂推迟扩产计划。设备层进入周期性调整，等待下一轮资本开支周期。",
            ],
            "neutral": [
                "半导体设备行业进入平稳增长期，东京电子和爱德万维持高市占率。新闻显示设备市场供需平衡，等待下一轮扩产周期启动。",
                "设备层技术升级持续推进，从刻蚀到测试各环节都在迎接AI芯片带来的新挑战。行业关注焦点转向先进封装设备的增量需求。",
            ],
        },
        "keywords": ["equipment", "etch", "test", "lithography", "deposition", "fab", "expansion", "Tokyo Electron", "Advantest", "ASML"],
    },
    {
        "id": "04",
        "title": "晶圆代工",
        "short": "代工",
        "symbols": ["TSM", "INTC"],
        "companies": [
            {"name": "台积电", "label": "先进制程垄断", "highlight": False},
            {"name": "三星代工", "label": "追赶者", "highlight": False},
            {"name": "Intel Foundry", "label": "破局者", "highlight": False},
        ],
        "templates": {
            "up": [
                "台积电3nm产能满载，先进制程需求强劲。最新新闻显示foundry市场供不应求，晶圆代工层成为芯片从设计到物理实现的关键桥梁。",
                "三星3nm GAA工艺取得突破，试图打破台积电垄断。晶圆代工层竞争格局出现新变数，技术创新正在加速。",
                "AI芯片对先进制程的需求爆发，台积电和三星代工订单排产至2027年。晶圆厂的产能利用率直接决定设备需求和材料消耗。",
            ],
            "down": [
                "晶圆厂产能利用率下滑，成熟制程价格战压缩毛利率。代工层短期承压，台积电和三星面临需求波动。",
                "部分AI芯片客户推迟流片计划，晶圆代工层订单增速放缓。成熟制程产能过剩问题凸显，代工层进入调整期。",
            ],
            "neutral": [
                "先进制程与成熟制程分化加剧，台积电维持技术领先，三星和Intel Foundry追赶中。代工层等待AI芯片需求的新一轮释放。",
                "晶圆代工层竞争格局稳定，台积电占据全球先进代工90%份额。行业关注焦点转向2nm工艺的量产进度和成本结构。",
            ],
        },
        "keywords": ["foundry", "3nm", "capacity", "utilization", "advanced process", "GAA", "TSMC", "Intel", "Samsung"],
    },
    {
        "id": "05",
        "title": "云服务商",
        "short": "云服务",
        "symbols": ["MSFT", "AMZN", "GOOGL", "META"],
        "companies": [
            {"name": "微软 Azure", "label": "最大买家", "highlight": True},
            {"name": "亚马逊 AWS", "label": "自研芯片", "highlight": False},
            {"name": "谷歌 GCP", "label": "TPU生态", "highlight": False},
            {"name": "Meta", "label": "AI算力中心", "highlight": False},
        ],
        "bigNumber": {"value": "8,300亿", "label": "美元资本支出"},
        "templates": {
            "up": [
                "云厂商资本支出维持高位，微软Azure、亚马逊AWS、谷歌GCP三家主导全球云市场。最新新闻显示AI基础设施投资竞赛白热化，云服务层是产业链的终端买单方。",
                "云厂商自建AI算力中心拉动上游需求，微软与OpenAI深度合作，亚马逊加速自研芯片布局。云服务层景气度处于历史高位，资本支出决定全产业链需求强度。",
                "全球CSP资本支出创历史纪录，云服务商的巨额投资正在创造半导体行业历史上最大的需求浪潮。微软、谷歌、亚马逊三强格局稳固。",
            ],
            "down": [
                "云业务增速放缓担忧升温，部分投资者担忧AI投资回报周期过长。云厂商资本开支面临收缩压力，上游产业链受牵连。",
                "宏观经济下行影响企业IT支出，云厂商营收增速回落。资本开支计划面临调整，云服务层短期承压。",
            ],
            "neutral": [
                "云市场进入平稳增长期，AI业务收入占比提升但增速回落。云服务层等待杀手级AI应用爆发，带动新一轮资本开支周期。",
                "云厂商竞争格局稳定，微软Azure领先，AWS和GCP紧随其后。行业关注焦点从基础设施投资转向AI应用的商业化落地。",
            ],
        },
        "keywords": ["capex", "cloud", "Azure", "AWS", "GCP", "AI infrastructure", "data center", "Microsoft", "Amazon", "Google"],
    },
]

INVESTMENT_TEMPLATES = {
    "up": [
        "软银集团作为产业链的投资层，通过愿景基金持有全球AI生态的关键节点：OpenAI（生成式AI）、Arm（芯片架构）、波士顿动力（机器人）、以及数十家AI初创企业。当日日经225上涨，市场对这种'全栈AI投资'模式的认可度持续强化。",
        "软银愿景基金核心持仓估值修复，OpenAI和Arm成为投资组合的重要支柱。当日市场表现积极，投资层捕获AI全链条价值的逻辑得到验证。",
    ],
    "down": [
        "软银集团作为产业链的投资层，通过愿景基金持有全球AI生态的关键节点：OpenAI（生成式AI）、Arm（芯片架构）、波士顿动力（机器人）、以及数十家AI初创企业。当日日经225调整，愿景基金部分投资组合面临估值压力。",
        "软银投资组合进入阶段性整理，科技股估值压缩影响投资收益。但中长期来看，OpenAI和Arm仍是AI生态中最具价值的资产。",
    ],
    "neutral": [
        "软银集团作为产业链的投资层，通过愿景基金持有全球AI生态的关键节点：OpenAI（生成式AI）、Arm（芯片架构）、波士顿动力（机器人）、以及数十家AI初创企业。它不直接参与任何一层的产品竞争，却在每一层都有战略投资布局。",
        "软银投资组合进入价值兑现期，OpenAI和Arm的估值变化成为关键催化剂。市场对'全栈AI投资'模式的认可度保持稳定。",
    ],
}


def fetch_company_news(symbols: List[str], max_age_hours: int = 48) -> List[Dict[str, str]]:
    """Fetch recent news headlines for a list of stock symbols via yfinance."""
    import yfinance as yf
    all_news: List[Dict[str, str]] = []
    cutoff = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)

    for symbol in symbols:
        try:
            ticker = yf.Ticker(symbol)
            news = ticker.news or []
            for item in news:
                content = item.get("content", {})
                title = content.get("title", "")
                summary = content.get("summary", "")
                pub_str = content.get("pubDate", "")
                if not title:
                    continue
                try:
                    pub_dt = datetime.fromisoformat(pub_str.replace("Z", "+00:00"))
                except Exception:
                    pub_dt = datetime.now(timezone.utc)
                if pub_dt >= cutoff:
                    all_news.append({
                        "symbol": symbol,
                        "title": title,
                        "summary": summary,
                        "pubDate": pub_str,
                    })
        except Exception as e:
            logger.warning(f"News fetch failed for {symbol}: {e}")

    # Deduplicate by title
    seen = set()
    deduped = []
    for n in all_news:
        if n["title"] not in seen:
            seen.add(n["title"])
            deduped.append(n)

    return deduped


RSS_FEEDS = [
    ("Yahoo Finance", "https://finance.yahoo.com/news/rssindex"),
    ("MarketWatch", "http://feeds.marketwatch.com/marketwatch/topstories/"),
    ("Reuters Tech", "https://feeds.reuters.com/reuters/technologyNews"),
    ("Nikkei Asia", "https://asia.nikkei.com/rss/feed/nar"),
    ("SeekingAlpha", "https://seekingalpha.com/market_currents.xml"),
]


def fetch_rss_news(max_age_hours: int = 48) -> List[Dict[str, str]]:
    """Fetch recent news from RSS feeds."""
    try:
        import feedparser
    except ImportError:
        logger.warning("feedparser not installed, skipping RSS sources")
        return []
    cutoff = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)
    out = []
    for source, url in RSS_FEEDS:
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:20]:
                pub = entry.get("published_parsed") or entry.get("updated_parsed")
                if pub:
                    pub_dt = datetime(*pub[:6], tzinfo=timezone.utc)
                    if pub_dt < cutoff:
                        continue
                out.append({
                    "symbol": source,
                    "title": entry.get("title", ""),
                    "summary": entry.get("summary", "")[:300],
                    "pubDate": entry.get("published", ""),
                })
        except Exception as e:
            logger.warning(f"RSS fetch failed for {source}: {e}")
    return out


# ---------------------------------------------------------------------------
# News Theme Classification
# ---------------------------------------------------------------------------
NEWS_THEME_KEYWORDS = {
    "AI Capex":   ["capex", "capital expenditure", "data center", "infrastructure", "spending", "investment"],
    "HBM/存储":   ["HBM", "memory", "DRAM", "Hynix", "Samsung memory", "storage", "DDR"],
    "AI芯片":     ["AI chip", "Blackwell", "Nvidia", "AMD", "GPU", "inference", "training", "CUDA"],
    "地缘/关税":  ["tariff", "trade", "sanction", "export control", "China chip", "geopolitic", "trade war"],
    "货币政策":   ["Fed", "rate", "inflation", "CPI", "Powell", "yields", "interest rate"],
}

TICKERS_FOR_NEWS = [
    "NVDA", "AMD", "MSFT", "AMZN", "GOOGL", "META", "AAPL", "TSM", "ASML",
    "005930.KS", "000660.KS", "8035.T", "6857.T", "9984.T", "MU", "INTC",
]


def get_news_highlights(max_per_theme: int = 3) -> Dict[str, List[Dict[str, str]]]:
    """Fetch and classify news into thematic buckets (yf + RSS)."""
    yf_news = fetch_company_news(TICKERS_FOR_NEWS, max_age_hours=48)
    rss_news = fetch_rss_news(max_age_hours=48)
    raw = yf_news + rss_news
    logger.info(f"Total news items for classification: yf={len(yf_news)}, rss={len(rss_news)}")
    by_theme: Dict[str, List[Dict[str, str]]] = {t: [] for t in NEWS_THEME_KEYWORDS}
    for n in raw:
        text = (n["title"] + " " + n.get("summary", "")).lower()
        matched = False
        for theme, kws in NEWS_THEME_KEYWORDS.items():
            if any(kw.lower() in text for kw in kws):
                if len(by_theme[theme]) < max_per_theme:
                    by_theme[theme].append({
                        "title": n["title"],
                        "summary": n.get("summary", "")[:200],
                        "pubDate": n.get("pubDate", ""),
                        "symbol": n.get("symbol", ""),
                    })
                matched = True
                break
        # Also try secondary match if no primary match
        if not matched:
            for theme, kws in NEWS_THEME_KEYWORDS.items():
                if any(kw.lower() in text for kw in kws):
                    if len(by_theme[theme]) < max_per_theme:
                        by_theme[theme].append({
                            "title": n["title"],
                            "summary": n.get("summary", "")[:200],
                            "pubDate": n.get("pubDate", ""),
                            "symbol": n.get("symbol", ""),
                        })
                    break
    return {k: v for k, v in by_theme.items() if v}


def analyze_layer_news(layer: Dict[str, Any], news_items: List[Dict[str, str]], index_change: float) -> str:
    """Pick the best description template based on news keywords and market direction."""
    direction = "up" if index_change >= 0.5 else "down" if index_change <= -0.5 else "neutral"
    templates = layer["templates"].get(direction, layer["templates"]["neutral"])
    keywords = [k.lower() for k in layer.get("keywords", [])]

    if not news_items or not keywords:
        return templates[0]

    # Score each template by keyword matches in news titles/summaries
    best_score = -1
    best_template = templates[0]
    all_text = " ".join([(n["title"] + " " + n["summary"]) for n in news_items]).lower()

    for tmpl in templates:
        score = sum(1 for kw in keywords if kw.lower() in all_text)
        if score > best_score:
            best_score = score
            best_template = tmpl

    return best_template


def get_chain_data(indices_data: List[Dict[str, Any]], news_highlights: Dict[str, List[Dict[str, str]]] = None) -> Dict[str, Any]:
    """Generate dynamic chain data with news-driven descriptions."""
    news_highlights = news_highlights or {}
    index_map = {idx["symbol"]: idx for idx in indices_data}
    nikkei = index_map.get("^N225", {})
    nikkei_change = _safe_pct(nikkei)

    layers = []
    for layer_cfg in CHAIN_LAYER_CONFIG:
        symbols = layer_cfg["symbols"]
        news = fetch_company_news(symbols, max_age_hours=72)
        logger.info(f"  Layer '{layer_cfg['title']}': fetched {len(news)} news items")

        # Determine direction from related index (US indices for design/cloud, N225 for equipment, KS11 for memory)
        related_change = 0.0
        if any(s in ["NVDA", "AMD", "MSFT", "AMZN", "GOOGL", "META"] for s in symbols):
            us = [index_map.get("^DJI", {}), index_map.get("^GSPC", {}), index_map.get("^IXIC", {})]
            related_change = sum(_safe_pct(i) for i in us) / len(us) if us else 0
        elif any(s in ["8035.T", "6857.T", "ASML"] for s in symbols):
            related_change = nikkei_change
        elif any(s in ["000660.KS", "005930.KS"] for s in symbols):
            related_change = _safe_pct(index_map.get("^KS11", {}))
        else:
            related_change = nikkei_change

        desc = analyze_layer_news(layer_cfg, news, related_change)

        # Optional LLM override for layer description
        llm_desc = generate_llm_analysis(
            indices_data, news_highlights,
            layer_title=f"AI半导体产业链 - {layer_cfg['title']}"
        )
        if llm_desc:
            desc = llm_desc

        layer_out: Dict[str, Any] = {
            "id": layer_cfg["id"],
            "title": layer_cfg["title"],
            "short": layer_cfg["short"],
            "companies": layer_cfg["companies"],
            "desc": desc,
            "bg": "obsidian" if int(layer_cfg["id"]) % 2 == 1 else "charcoal",
            "layout": "data-left" if int(layer_cfg["id"]) % 2 == 1 else "mirror",
        }
        if "marketSize" in layer_cfg:
            layer_out["marketSize"] = layer_cfg["marketSize"]
        if "stats" in layer_cfg:
            layer_out["stats"] = layer_cfg["stats"]
        if "bigNumber" in layer_cfg:
            layer_out["bigNumber"] = layer_cfg["bigNumber"]

        layers.append(layer_out)

    # Investment layer direction based on Nikkei
    inv_direction = "up" if nikkei_change >= 0.5 else "down" if nikkei_change <= -0.5 else "neutral"
    inv_templates = INVESTMENT_TEMPLATES.get(inv_direction, INVESTMENT_TEMPLATES["neutral"])

    # Fetch SoftBank news for investment layer
    sb_news = fetch_company_news(["9984.T"], max_age_hours=72)
    inv_desc = inv_templates[0]
    if sb_news:
        sb_text = " ".join([(n["title"] + " " + n["summary"]) for n in sb_news]).lower()
        sb_keywords = ["softbank", "vision fund", "openai", "arm", "investment"]
        best_score = -1
        for tmpl in inv_templates:
            score = sum(1 for kw in sb_keywords if kw in sb_text)
            if score > best_score:
                best_score = score
                inv_desc = tmpl

    investment = {
        "title": "投资层: 软银集团",
        "desc": inv_desc,
        "portfolio": [
            {"name": "OpenAI", "role": "生成式AI"},
            {"name": "Arm", "role": "芯片架构"},
            {"name": "波士顿动力", "role": "机器人"},
            {"name": "其他AI投资", "role": "初创组合"},
        ],
    }

    # Dynamic summary
    us_avg = sum(_safe_pct(index_map.get(s, {})) for s in ["^DJI", "^GSPC", "^IXIC"]) / 3
    if us_avg >= 0.5 and nikkei_change >= 0.5:
        summary = f"全球AI半导体产业链全线走强：云服务商资本支出驱动芯片设计订单爆发，HBM存储和半导体设备紧随其后。当前美股平均上涨{us_avg:+.2f}%，日经225上涨{nikkei_change:+.2f}%，软银集团作为投资层捕获全产业链价值。"
    elif us_avg <= -0.5 and nikkei_change <= -0.5:
        summary = f"全球AI半导体产业链同步调整：市场对资本开支周期见顶的担忧升温，各环节面临获利回吐压力。当前美股平均调整{abs(us_avg):.2f}%，日经225调整{abs(nikkei_change):.2f}%，建议关注回调后的布局机会。"
    else:
        summary = f"全球AI半导体产业链分化运行：美股平均{us_avg:+.2f}%，日经225{nikkei_change:+.2f}%。云服务商资本支出仍是产业链核心驱动力，设备商和存储商景气度保持韧性，软银集团投资层横跨整个链条捕获价值。"

    return {
        "lastUpdated": now_shanghai(),
        "layers": layers,
        "investment": investment,
        "summary": summary,
    }


# ---------------------------------------------------------------------------
# Market Analysis Generation (enrich market-data.json with dynamic text)
# ---------------------------------------------------------------------------

def _make_index_comment(symbol: str, change_pct: float, top3: List[Dict[str, Any]]) -> str:
    """Generate dynamic headline comment for an index based on contributors."""
    top_name = top3[0]["name"] if top3 else ""
    top_change = top3[0]["changePercent"] if top3 else 0
    top_suffix = f"，{top_name}表现突出" if top_name and top_change >= 0 else f"，{top_name}承压" if top_name else ""

    if symbol == "^DJI":
        if change_pct >= 1:
            return f"道指强势上攻，权重股协同发力{top_suffix}，工业与金融板块共振上行"
        if change_pct >= 0.3:
            return f"道指温和收涨{top_suffix}，大盘蓝筹稳健"
        if change_pct >= -0.3:
            return "道指窄幅整理，成分股表现分化，等待方向选择"
        if change_pct >= -1:
            return f"道指小幅回调{top_suffix}，防御板块相对抗跌"
        return f"道指明显回落{top_suffix}，关注下方支撑力度"

    if symbol == "^GSPC":
        if change_pct >= 1:
            return f"标普500普涨{top_suffix}，各行业板块共振上行"
        if change_pct >= 0.3:
            return f"标普500温和收涨{top_suffix}，大盘蓝筹稳健"
        if change_pct >= -0.3:
            return "标普500窄幅波动，市场观望情绪较浓"
        if change_pct >= -1:
            return f"标普500小幅调整{top_suffix}，成长股分化"
        return f"标普500显著回落{top_suffix}，注意风险控制"

    if symbol == "^IXIC":
        if change_pct >= 1.5:
            return f"纳指强势领涨，科技股风险偏好回升{top_suffix}"
        if change_pct >= 0.5:
            return f"纳指表现活跃{top_suffix}，AI概念股热度不减"
        if change_pct >= -0.5:
            return "纳指窄幅震荡，科技股分化明显，等待新催化"
        if change_pct >= -1.5:
            return f"纳指小幅回调{top_suffix}，高估值板块分化"
        return f"纳指大幅回落{top_suffix}，科技板块集体调整"

    if symbol == "^N225":
        if change_pct >= 1.5:
            return f"日经225强势上攻{top_suffix}，半导体设备股表现突出"
        if change_pct >= 0.5:
            return f"日经225稳步上行{top_suffix}，出口型企业受益"
        if change_pct >= -0.5:
            return "日经225窄幅整理，市场等待美股指引方向"
        if change_pct >= -1.5:
            return f"日经225小幅回调{top_suffix}，获利盘兑现压力显现"
        return f"日经225显著回落{top_suffix}，外资流出迹象显现"

    if symbol == "^KS11":
        if change_pct >= 1:
            return f"KOSPI放量上涨{top_suffix}，半导体双雄表现亮眼"
        if change_pct >= 0.3:
            return f"KOSPI温和收涨{top_suffix}，芯片股表现亮眼"
        if change_pct >= -0.3:
            return "KOSPI横盘整理，市场等待催化剂"
        if change_pct >= -1:
            return f"KOSPI小幅调整{top_suffix}，电池板块拖累大盘"
        return f"KOSPI明显回落{top_suffix}，外资减持权重标的"

    return ""


def _make_index_subcomment(symbol: str, change_pct: float, top3: List[Dict[str, Any]]) -> str:
    """Generate dynamic sub-comment for an index."""
    top_name = top3[0]["name"] if top3 else ""
    top_sector = top3[0]["sector"] if top3 else ""
    top_part = f"，{top_name}({top_sector})表现突出" if top_name and change_pct >= 0 else f"，{top_name}({top_sector})领跌" if top_name else ""

    if symbol == "^DJI":
        if change_pct >= 0:
            return f"道指30只成分股涨跌互现{top_part}，金融与工业板块分化"
        return f"道指30只成分股跌多涨少{top_part}，周期性板块承压"

    if symbol == "^GSPC":
        if change_pct >= 0:
            return f"标普11大板块多数收红{top_part}，科技与通信服务表现强劲"
        return f"标普11大板块多数收跌{top_part}，可选消费与房地产承压"

    if symbol == "^IXIC":
        if change_pct >= 0:
            return f"大型科技股韧性显现{top_part}，半导体设备股持续强势"
        return f"高估值成长股承压{top_part}，芯片设计龙头跌幅居前"

    if symbol == "^N225":
        if change_pct >= 0:
            return f"AI半导体超级周期驱动{top_part}，外资持续净流入日本市场"
        return f"日元走强压制出口股{top_part}，半导体板块获利回吐"

    if symbol == "^KS11":
        if change_pct >= 0:
            return f"SK海力士与三星电子双轮驱动{top_part}，芯片股引领市场"
        return f"存储芯片股回调拖累大盘{top_part}，外资净卖出权重标的"

    return ""


def _make_index_drivers(symbol: str, change_pct: float, top3: List[Dict[str, Any]]) -> List[str]:
    """Generate key driver bullets based on top contributors."""
    drivers: List[str] = []

    # Top contributor driver
    if top3:
        top = top3[0]
        trend_word = "领涨" if top["changePercent"] >= 0 else "领跌"
        drivers.append(
            f"{top['name']} {trend_word} {abs(top['changePercent']):.2f}%，"
            f"对指数贡献 {top['contribution']}，属于{top['sector']}板块"
        )

    # Second contributor
    if len(top3) >= 2:
        second = top3[1]
        trend_word = "上涨" if second["changePercent"] >= 0 else "下跌"
        drivers.append(
            f"{second['name']} {trend_word} {abs(second['changePercent']):.2f}%，"
            f"{second['sector']}板块{'表现强劲' if second['changePercent'] >= 0 else '承压'}"
        )

    # Market-wide driver based on direction
    if symbol in ("^DJI", "^GSPC", "^IXIC"):
        if change_pct >= 1:
            drivers.append("美股风险偏好全面回升，AI产业链引领涨势")
        elif change_pct <= -1:
            drivers.append("避险情绪阶段性升温，高估值板块集体承压")
        else:
            drivers.append("市场观望情绪较浓，等待美联储政策指引")
    elif symbol == "^N225":
        if change_pct >= 1:
            drivers.append("AI半导体超级周期预期持续升温，日本本土产业链全面受益")
        elif change_pct <= -1:
            drivers.append("日元走强压制出口型企业盈利预期，外资阶段性减持")
        else:
            drivers.append("日经225高位震荡，等待美股方向指引")
    elif symbol == "^KS11":
        if change_pct >= 1:
            drivers.append("半导体双雄带动大盘，韩国在全球存储芯片版图中的地位持续巩固")
        elif change_pct <= -1:
            drivers.append("存储芯片需求放缓担忧升温，电池板块同步承压")
        else:
            drivers.append("KOSPI横盘整理，市场等待半导体行业新催化")

    # Add sector-specific driver from analysis
    if top3 and top3[0].get("analysis"):
        analysis_list = top3[0]["analysis"]
        if analysis_list:
            drivers.append(analysis_list[0])

    return drivers[:4]


def _make_hero_subtitle(indices_data: List[Dict[str, Any]]) -> str:
    """Generate dynamic hero subtitle for Markets page."""
    us = [i for i in indices_data if i["region"] == "United States"]
    nikkei = next((i for i in indices_data if i["symbol"] == "^N225"), {})
    kospi = next((i for i in indices_data if i["symbol"] == "^KS11"), {})
    date_str = datetime.now(timezone(timedelta(hours=8))).strftime("%Y年%m月%d日")

    us_avg = sum(_safe_pct(i) for i in us) / len(us) if us else 0
    nikkei_change = _safe_pct(nikkei)
    kospi_change = _safe_pct(kospi)

    status = "全线收涨" if us_avg >= 0 and nikkei_change >= 0 and kospi_change >= 0 else \
             "全线收跌" if us_avg < 0 and nikkei_change < 0 and kospi_change < 0 else \
             "收盘分化"

    return f"美股 · 日经 · KOSPI — {date_str}收盘全景 · {status}"


def _make_us_descriptions(indices_data: List[Dict[str, Any]]) -> List[str]:
    """Generate dynamic descriptions for US indices on Markets page."""
    us = {i["symbol"]: i for i in indices_data if i["region"] == "United States"}
    dji = us.get("^DJI", {})
    spx = us.get("^GSPC", {})
    ndx = us.get("^IXIC", {})

    dji_pct = _safe_pct(dji)
    spx_pct = _safe_pct(spx)
    ndx_pct = _safe_pct(ndx)

    descs = []
    # Dow
    if dji_pct >= 1:
        descs.append(f"道指强势上涨{dji_pct:.2f}%，成分股普涨，工业与金融板块共振")
    elif dji_pct >= 0:
        descs.append(f"道指温和收涨{dji_pct:.2f}%，权重股表现分化，大盘蓝筹稳健")
    elif dji_pct >= -1:
        descs.append(f"道指小幅回调{abs(dji_pct):.2f}%，防御板块相对抗跌")
    else:
        descs.append(f"道指明显回落{abs(dji_pct):.2f}%，周期性板块承压")

    # S&P
    if spx_pct >= 1:
        descs.append(f"标普500强势上涨{spx_pct:.2f}%，各行业板块共振上行，大盘蓝筹稳健")
    elif spx_pct >= 0:
        descs.append(f"标普500温和收涨{spx_pct:.2f}%，科技与通信服务表现强劲")
    elif spx_pct >= -1:
        descs.append(f"标普500小幅调整{abs(spx_pct):.2f}%，成长股分化")
    else:
        descs.append(f"标普500显著回落{abs(spx_pct):.2f}%，可选消费与房地产领跌")

    # Nasdaq
    if ndx_pct >= 1.5:
        descs.append(f"纳指强势领涨{ndx_pct:.2f}%，科技股风险偏好全面回升，AI概念股受追捧")
    elif ndx_pct >= 0:
        descs.append(f"纳指表现活跃{ndx_pct:.2f}%，大型科技股韧性显现")
    elif ndx_pct >= -1.5:
        descs.append(f"纳指小幅回调{abs(ndx_pct):.2f}%，高估值板块承压")
    else:
        descs.append(f"纳指大幅回落{abs(ndx_pct):.2f}%，科技板块集体调整")

    return descs


def _make_nikkei_drivers(change_pct: float, top3: List[Dict[str, Any]]) -> List[str]:
    """Generate dynamic key drivers for Nikkei section."""
    drivers: List[str] = []
    if top3:
        top = top3[0]
        trend = "暴涨" if top["changePercent"] >= 5 else "大涨" if top["changePercent"] >= 2 else "上涨" if top["changePercent"] >= 0 else "大跌" if top["changePercent"] <= -2 else "下跌"
        drivers.append(f"{top['name']}{trend} {abs(top['changePercent']):.2f}%，贡献日经225最大点数{'涨幅' if top['changePercent'] >= 0 else '跌幅'}")
    drivers.append("AI半导体超级周期预期持续升温，全球资本向日本硬科技产业链集中")
    drivers.append("日本本土半导体产业链全面受益，设备商和材料商订单饱满")
    return drivers


def _make_kospi_background(change_pct: float, top3: List[Dict[str, Any]]) -> str:
    """Generate dynamic background text for KOSPI section."""
    if top3:
        top = top3[0]
        second = top3[1] if len(top3) > 1 else None
        text = f"韩国股市在半导体双雄的带动下{'刷新盘中历史新高' if change_pct >= 1 else '表现活跃' if change_pct >= 0 else '承压调整'}。"
        text += f"{top['name']}凭借在{'HBM高带宽内存' if '海力士' in top['name'] else top['sector']}领域的领先地位，"
        text += f"{'持续受益于全球AI算力扩张' if top['changePercent'] >= 0 else '短期面临获利回吐压力'}。"
        if second:
            text += f"{second['name']}Q1业绩{'超预期' if second['changePercent'] >= 0 else '不及预期'}，"
            text += f"{'进一步巩固了韩国在全球半导体版图中的核心地位' if second['changePercent'] >= 0 else '对市场情绪形成一定压制'}。"
        return text
    return "韩国股市在半导体双雄的带动下表现活跃，SK海力士凭借在HBM高带宽内存领域的绝对领先地位，持续受益于全球AI算力扩张。三星电子在全球存储芯片版图中的地位持续巩固。"


def _make_cross_market_summary(indices_data: List[Dict[str, Any]]) -> str:
    """Generate dynamic cross-market comparison summary."""
    us = [i for i in indices_data if i["region"] == "United States"]
    nikkei = next((i for i in indices_data if i["symbol"] == "^N225"), {})
    kospi = next((i for i in indices_data if i["symbol"] == "^KS11"), {})

    us_avg = sum(_safe_pct(i) for i in us) / len(us) if us else 0
    nikkei_change = _safe_pct(nikkei)
    kospi_change = _safe_pct(kospi)

    asia_up = nikkei_change >= 0 and kospi_change >= 0
    us_up = us_avg >= 0

    if asia_up and us_up:
        return f"全球主要市场同步上涨，风险偏好全面回升。美股平均上涨{us_avg:.2f}%，日经225上涨{nikkei_change:.2f}%，KOSPI上涨{kospi_change:.2f}%，AI产业链仍是跨市场核心主线。"
    elif asia_up and not us_up:
        return f"亚洲市场领涨，美股相对疲软。日经225上涨{nikkei_change:.2f}%，KOSPI上涨{kospi_change:.2f}%，而美股平均调整{abs(us_avg):.2f}%。资金持续向AI硬科技产业链集中配置。"
    elif not asia_up and us_up:
        return f"美股表现稳健，亚洲市场短期调整。美股平均上涨{us_avg:.2f}%，日经225调整{abs(nikkei_change):.2f}%，KOSPI{kospi_change:+.2f}%。全球分化格局延续，中长期向上逻辑未变。"
    else:
        return f"全球主要市场同步回调，避险情绪升温。美股平均调整{abs(us_avg):.2f}%，日经225调整{abs(nikkei_change):.2f}%，KOSPI调整{abs(kospi_change):.2f}%。短期获利回吐压力显现，关注AI产业链韧性。"


def enrich_market_data(market_data: Dict[str, Any], leaders_data: List[Dict[str, Any]]) -> None:
    """Add dynamic analysis fields to market_data for frontend consumption."""
    leaders_map = {item["indexSymbol"]: item for item in leaders_data}
    indices = market_data.get("indices", [])

    for idx in indices:
        symbol = idx["symbol"]
        change_pct = _safe_pct(idx)
        leaders = leaders_map.get(symbol, {})
        top3 = leaders.get("topContributors", [])

        idx["analysis"] = {
            "comment": _make_index_comment(symbol, change_pct, top3),
            "subComment": _make_index_subcomment(symbol, change_pct, top3),
            "drivers": _make_index_drivers(symbol, change_pct, top3),
            "topContributors": [
                {
                    "name": c["name"],
                    "nameEn": c["nameEn"],
                    "changePercent": c["changePercent"],
                    "contribution": c["contribution"],
                    "sector": c["sector"],
                    "analysis": c.get("analysis", [])[:2],
                }
                for c in top3[:3]
            ],
        }

    market_data["heroSubtitle"] = _make_hero_subtitle(indices)
    market_data["crossMarketSummary"] = _make_cross_market_summary(indices)
    market_data["usDescriptions"] = _make_us_descriptions(indices)
    market_data["nikkeiDrivers"] = _make_nikkei_drivers(
        next((_safe_pct(i) for i in indices if i["symbol"] == "^N225"), 0),
        leaders_map.get("^N225", {}).get("topContributors", [])
    )
    market_data["kospiBackground"] = _make_kospi_background(
        next((_safe_pct(i) for i in indices if i["symbol"] == "^KS11"), 0),
        leaders_map.get("^KS11", {}).get("topContributors", [])
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def _load_previous(path: str) -> Dict[str, Any]:
    """Load previous JSON output if it exists."""
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def _is_fresh(last_updated: str, max_hours: int = 168) -> bool:
    """Check if lastUpdated is within max_hours (default 7 days)."""
    try:
        dt = datetime.fromisoformat(last_updated)
        return (datetime.now(timezone.utc) - dt) < timedelta(hours=max_hours)
    except Exception:
        return False


def main():
    ts = now_shanghai()
    logger.info(f"=== Market Data Fetch Started at {ts} ===")

    # Pre-load previous outputs for LLM fallback
    prev_macro = _load_previous(os.path.join(OUTPUT_DIR, "macro-data.json"))
    prev_chain = _load_previous(os.path.join(OUTPUT_DIR, "chain-data.json"))

    # --- 1. Fetch market data ---
    try:
        indices_data = fetch_index_data()
        if not indices_data:
            logger.warning("No index data fetched; keeping existing files.")
            return
    except Exception as e:
        logger.error(f"Critical error during data fetch: {e}")
        logger.info("Keeping existing data files unchanged.")
        return

    market_data = {
        "lastUpdated": ts,
        "indices": indices_data,
    }

    # --- 2. Build leaders data (dynamic, based on real-time stock data) ---
    try:
        leaders_indices = get_leaders_data(indices_data)
        leaders_data = {
            "lastUpdated": ts,
            "indices": leaders_indices,
        }
        logger.info(f"Built leaders data with {len(leaders_indices)} indices")
    except Exception as e:
        logger.error(f"Error building leaders data: {e}")
        leaders_data = {"lastUpdated": ts, "indices": []}

    # --- 3. Enrich market data with dynamic analysis text ---
    try:
        enrich_market_data(market_data, leaders_data.get("indices", []))
        logger.info("Enriched market data with dynamic analysis")
    except Exception as e:
        logger.error(f"Error enriching market data: {e}")

    # --- 3.5 Fetch and classify news highlights ---
    try:
        news_highlights = get_news_highlights()
        logger.info(f"Classified news into {len(news_highlights)} themes")
    except Exception as e:
        logger.error(f"Error fetching news highlights: {e}")
        news_highlights = {}

    # --- 4. Build macro data (dynamic, based on real-time index data) ---
    try:
        macro_data = get_macro_data(indices_data, news_highlights)
        macro_data["lastUpdated"] = ts
        macro_data["newsHighlights"] = news_highlights
        # Fallback: if LLM failed this run but previous run had LLM content, reuse it
        if not macro_data.get("llmGenerated") and prev_macro.get("llmGenerated") and _is_fresh(prev_macro.get("lastUpdated", "")):
            macro_data["summary"] = prev_macro["summary"]
            macro_data["llmGenerated"] = True
            macro_data["llmCached"] = True
            logger.info("Reused previous LLM macro summary (cache fallback)")
        logger.info("Built macro data")
    except Exception as e:
        logger.error(f"Error building macro data: {e}")
        macro_data = {"lastUpdated": ts, "summary": "数据生成中", "factors": [], "cspCapex": [], "keyEvents": [], "newsHighlights": {}}

    # --- 5. Build chain data (news-driven dynamic descriptions) ---
    try:
        chain_data = get_chain_data(indices_data, news_highlights)
        chain_data["newsHighlights"] = news_highlights
        # Fallback: reuse previous LLM layer descriptions if current run failed
        if prev_chain.get("layers") and _is_fresh(prev_chain.get("lastUpdated", "")):
            prev_layers = {l["id"]: l for l in prev_chain.get("layers", []) if l.get("llmGenerated")}
            for layer in chain_data.get("layers", []):
                if not layer.get("llmGenerated") and layer["id"] in prev_layers:
                    layer["desc"] = prev_layers[layer["id"]]["desc"]
                    layer["llmGenerated"] = True
                    layer["llmCached"] = True
            if any(l.get("llmCached") for l in chain_data.get("layers", [])):
                logger.info("Reused previous LLM chain layer descriptions (cache fallback)")
        logger.info("Built chain data with news-driven descriptions")
    except Exception as e:
        logger.error(f"Error building chain data: {e}")
        chain_data = {
            "lastUpdated": ts,
            "layers": [],
            "investment": {"title": "投资层: 软银集团", "desc": "数据生成中...", "portfolio": []},
            "summary": "数据生成中",
        }

    # --- 6. Build meta ---
    next_update = (datetime.now(timezone(timedelta(hours=8))) + timedelta(hours=2)).strftime(
        "%Y-%m-%dT%H:%M:%S+08:00"
    )
    meta = {
        "lastUpdated": ts,
        "dataSource": "Yahoo Finance",
        "status": "success",
        "nextUpdate": next_update,
    }

    # --- Write all JSON files ---
    try:
        write_json(os.path.join(OUTPUT_DIR, "market-data.json"), market_data)
        write_json(os.path.join(OUTPUT_DIR, "leaders-data.json"), leaders_data)
        write_json(os.path.join(OUTPUT_DIR, "macro-data.json"), macro_data)
        write_json(os.path.join(OUTPUT_DIR, "chain-data.json"), chain_data)
        write_json(os.path.join(OUTPUT_DIR, "meta.json"), meta)
        logger.info("=== All files written successfully ===")
    except Exception as e:
        logger.error(f"Failed to write output files: {e}")
        logger.info("Existing data files preserved.")


if __name__ == "__main__":
    main()
