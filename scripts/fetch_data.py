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


# ---------------------------------------------------------------------------
# Placeholder / Enrichment Data
# ---------------------------------------------------------------------------
def get_placeholder_leaders() -> list:
    """Return placeholder top-contributor data with realistic structure.
    In production this could be sourced from a paid API or web scraping."""
    today = datetime.now(timezone(timedelta(hours=8)))
    date_str = (today - timedelta(days=1)).strftime("%Y-%m-%d")

    return [
        {
            "indexName": "日经225",
            "indexSymbol": "^N225",
            "date": date_str,
            "topContributors": [
                {
                    "rank": 1,
                    "name": "软银集团",
                    "nameEn": "SoftBank Group",
                    "symbol": "9984.JP",
                    "changePercent": 18.4,
                    "weight": "~8.4%",
                    "contribution": "~717日元",
                    "contributionShare": "~21.6%",
                    "sector": "投资控股 · AI生态",
                    "analysis": [
                        "OpenAI投资：旗下愿景基金深度布局OpenAI，直接受益于$250B Stargate项目",
                        "Arm Holdings：持有Arm 90%股权，Arm架构主导全球AI芯片设计底层",
                        "Golden Week rally：黄金周后补涨行情，日经225最大贡献股",
                    ],
                },
                {
                    "rank": 2,
                    "name": "爱德万测试",
                    "nameEn": "Advantest",
                    "symbol": "6857.JP",
                    "changePercent": 6.8,
                    "weight": "~3.1%",
                    "contribution": "~98日元",
                    "contributionShare": "~3.0%",
                    "sector": "半导体设备 · 测试",
                    "analysis": [
                        "AI芯片测试需求：HBM3E和先进制程芯片测试需求爆发",
                        "NVIDIA供应链：核心测试设备供应商，受益于GPU产能扩张",
                    ],
                },
                {
                    "rank": 3,
                    "name": "东京电子",
                    "nameEn": "Tokyo Electron",
                    "symbol": "8035.JP",
                    "changePercent": 9.0,
                    "weight": "~4.5%",
                    "contribution": "~168日元",
                    "contributionShare": "~5.1%",
                    "sector": "半导体设备 · 制造",
                    "analysis": [
                        "刻蚀设备龙头：全球最先进的半导体制造设备供应商之一",
                        "AI服务器需求：先进制程产能扩张直接拉动设备订单",
                    ],
                },
            ],
        },
        {
            "indexName": "韩国综合股价指数",
            "indexSymbol": "^KS11",
            "date": date_str,
            "topContributors": [
                {
                    "rank": 1,
                    "name": "三星电子",
                    "nameEn": "Samsung Electronics",
                    "symbol": "005930.KS",
                    "changePercent": 2.07,
                    "weight": "~16.8%",
                    "contribution": "~3.5点",
                    "contributionShare": "~16.2%",
                    "sector": "半导体 · 存储/D代工",
                    "analysis": [
                        "HBM3E供应：全球唯一HBM3E量产供应商，占据NVIDIA 100%份额",
                        "先进封装：HBM封装良率提升推动利润率改善预期",
                    ],
                },
                {
                    "rank": 2,
                    "name": "SK海力士",
                    "nameEn": "SK Hynix",
                    "symbol": "000660.KS",
                    "changePercent": 3.31,
                    "weight": "~7.2%",
                    "contribution": "~2.4点",
                    "contributionShare": "~11.1%",
                    "sector": "半导体 · HBM存储",
                    "analysis": [
                        "HBM产能满载：2026年HBM产能全部售罄，ASP持续上涨",
                        "AI服务器标配：每颗AI芯片搭配6-12颗HBM，需求弹性极高",
                    ],
                },
                {
                    "rank": 3,
                    "name": "现代汽车",
                    "nameEn": "Hyundai Motor",
                    "symbol": "005380.KS",
                    "changePercent": 4.00,
                    "weight": "~5.5%",
                    "contribution": "~2.2点",
                    "contributionShare": "~10.2%",
                    "sector": "汽车 · 新能源",
                    "analysis": [
                        "电动车增长：全球电动车销量持续增长，Ioniq系列表现强劲",
                        "印度市场：印度子公司IPO提升估值预期",
                    ],
                },
            ],
        },
        {
            "indexName": "道琼斯工业平均指数",
            "indexSymbol": "^DJI",
            "date": date_str,
            "topContributors": [
                {
                    "rank": 1,
                    "name": "卡特彼勒",
                    "nameEn": "Caterpillar",
                    "symbol": "CAT",
                    "changePercent": -3.34,
                    "weight": "~4.1%",
                    "contribution": "~-13.7点",
                    "contributionShare": "~4.4%",
                    "sector": "工业机械 · 建筑/矿业",
                    "analysis": [
                        "关税不确定性：全球贸易紧张局势影响跨国设备订单",
                        "大宗商品价格：铜价回调反映工业需求放缓担忧",
                    ],
                },
                {
                    "rank": 2,
                    "name": "摩根大通",
                    "nameEn": "JPMorgan Chase",
                    "symbol": "JPM",
                    "changePercent": -2.73,
                    "weight": "~3.8%",
                    "contribution": "~-10.5点",
                    "contributionShare": "~3.3%",
                    "sector": "金融服务 · 投资银行",
                    "analysis": [
                        "利率预期：美联储维持高利率，净息差压力持续",
                        "投行业务：IPO和并购市场低迷影响非息收入",
                    ],
                },
                {
                    "rank": 3,
                    "name": "波音",
                    "nameEn": "Boeing",
                    "symbol": "BA",
                    "changePercent": -2.15,
                    "weight": "~3.5%",
                    "contribution": "~-7.5点",
                    "contributionShare": "~2.4%",
                    "sector": "航空航天 · 国防",
                    "analysis": [
                        "罢工影响：西雅图工厂罢工影响737 MAX交付",
                        "现金流压力：持续现金消耗引发债务评级关注",
                    ],
                },
            ],
        },
    ]


def get_placeholder_macro() -> dict:
    """Return placeholder macro-economic indicator data."""
    return {
        "summary": "AI半导体超级周期驱动全球股市分化，日韩创新高美股回调",
        "factors": [
            {
                "name": "AI超级周期",
                "impact": 5,
                "detail": "全球九大CSP资本支出8,300亿美元(+79%)，HBM产能全部售罄，AI芯片需求呈指数级增长",
            },
            {
                "name": "美联储政策",
                "impact": 4,
                "detail": "基准利率维持4.25-4.50%，市场对6月降息预期升温，强美元压制美股出口企业",
            },
            {
                "name": "日韩牛市",
                "impact": 4,
                "detail": "日经225突破62,800(+5.58%)，KOSPI创历史新高7,490(+1.43%)，半导体产业链集中受益",
            },
            {
                "name": "地缘政治风险",
                "impact": 3,
                "detail": "中美贸易摩擦持续，但日韩与AI供应链关系紧密，相对免疫",
            },
            {
                "name": "关税不确定性",
                "impact": 3,
                "detail": "美国可能加征汽车/半导体关税，对道指工业股构成压力",
            },
        ],
        "cspCapex": [
            {"company": "Microsoft", "amount": 1900, "change": "+130%"},
            {"company": "Amazon", "amount": 2300, "change": "+50%"},
            {"company": "Google", "amount": 1850, "change": "+100%"},
            {"company": "Meta", "amount": 1350, "change": "+85%"},
            {"company": "Oracle", "amount": 800, "change": "+167%"},
            {"company": "Tesla/xAI", "amount": 500, "change": "+200%"},
            {"company": "Apple", "amount": 450, "change": "+60%"},
            {"company": "NVIDIA", "amount": 400, "change": "+100%"},
        ],
        "keyEvents": [
            {
                "date": "2026-04-25",
                "title": "SK海力士宣布HBM3E量产扩产计划",
                "impact": "半导体供应链全面受益",
            },
            {
                "date": "2026-05-01",
                "title": "日本政府推出半导体振兴法案修订版",
                "impact": "Tokyo Electron等设备商受益",
            },
            {
                "date": "2026-05-05",
                "title": "NVIDIA发布Blackwell Ultra GPU架构",
                "impact": "AI算力需求再超预期",
            },
        ],
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

    # --- 2. Build leaders data ---
    leaders_data = {
        "lastUpdated": ts,
        "indices": get_placeholder_leaders(),
    }

    # --- 3. Build macro data ---
    macro_data = get_placeholder_macro()
    macro_data["lastUpdated"] = ts

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
