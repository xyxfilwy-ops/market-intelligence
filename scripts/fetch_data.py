#!/usr/bin/env python3
"""
Daily Financial Market Data Fetcher
Uses yfinance (free) to fetch market data and generates JSON data files for the frontend.
"""

import json
import os
import sys
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any

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


def get_macro_data(indices_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate dynamic macro data based on real-time market data.
    Returns structure compatible with the frontend Macro.tsx component."""
    index_map = {idx["symbol"]: idx for idx in indices_data}

    us_indices = [idx for idx in indices_data if idx["region"] == "United States"]
    nikkei = index_map.get("^N225", {})
    kospi = index_map.get("^KS11", {})

    # Determine market trend summary
    us_avg_change = sum(idx.get("changePercent", 0) for idx in us_indices) / len(us_indices) if us_indices else 0
    nikkei_change = nikkei.get("changePercent", 0)
    kospi_change = kospi.get("changePercent", 0)

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

    return {
        "summary": summary,
        "supercycle": {
            "arguments": [
                {
                    "title": "算力需求呈指数级增长",
                    "content": f"全球九大CSP资本支出维持高位，AI芯片需求持续强劲。当前道指{us_avg_change:+.2f}%、日经{nikkei_change:+.2f}%、KOSPI{kospi_change:+.2f}%的收盘表现，反映市场对AI产业链的信心分化。",
                },
                {
                    "title": "HBM成为性能瓶颈与价值核心",
                    "content": "从HBM2E到HBM3E再到HBM4，每一代堆叠层数翻倍，带宽提升40%以上。SK海力士凭借与NVIDIA的深度绑定，建立了难以逾越的技术护城河。",
                },
                {
                    "title": "CSP资本支出创历史纪录",
                    "content": "微软、亚马逊、谷歌等云厂商2026年AI基建投资超过8,300亿美元，同比增长79%。这笔巨额资本支出正在创造半导体行业历史上最大的需求浪潮。",
                },
            ],
            "stats": [
                {"value": "8,300亿", "label": "美元CSP资本支出"},
                {"value": "+79%", "label": "同比增幅"},
                {"value": "57-62%", "label": "SK海力士HBM市占率"},
            ],
        },
        "geopolitics": {
            "leftColumn": {
                "title": "贸易摩擦与供应链重构",
                "content": "美国可能进一步加征汽车/半导体关税，但日韩与AI供应链关系紧密，相对免疫。中国半导体自主化加速，对全球格局产生深远影响。",
                "impacts": [
                    "关税不确定性：对道指工业股构成阶段性压力",
                    "供应链区域化：东亚半导体产业链地位进一步强化",
                    "技术封锁：倒逼中国半导体自主化进程加速",
                ],
            },
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


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    ts = now_shanghai()
    logger.info(f"=== Market Data Fetch Started at {ts} ===")

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

    # --- 3. Build macro data (dynamic, based on real-time index data) ---
    try:
        macro_data = get_macro_data(indices_data)
        macro_data["lastUpdated"] = ts
        logger.info("Built macro data")
    except Exception as e:
        logger.error(f"Error building macro data: {e}")
        macro_data = {"lastUpdated": ts, "summary": "数据生成中", "factors": [], "cspCapex": [], "keyEvents": []}

    # --- 4. Build meta ---
    next_update = (datetime.now(timezone(timedelta(hours=8))) + timedelta(days=1)).strftime(
        "%Y-%m-%dT07:00:00+08:00"
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
        write_json(os.path.join(OUTPUT_DIR, "meta.json"), meta)
        logger.info("=== All files written successfully ===")
    except Exception as e:
        logger.error(f"Failed to write output files: {e}")
        logger.info("Existing data files preserved.")


if __name__ == "__main__":
    main()
