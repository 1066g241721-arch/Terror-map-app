<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>日本全国 心霊スポットマップ</title>

  <!-- Leaflet CSS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <!-- MarkerCluster CSS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />

  <style>
    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      font-family: "Noto Sans JP", "Yu Gothic", sans-serif;
    }

    #map {
      width: 100%;
      height: 100vh;
    }

    /* 左上コントロールパネル */
    .map-ui {
      position: fixed;
      top: 15px;
      left: 60px;
      z-index: 1000;
      width: 320px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.25);
      overflow: hidden;
    }

    .map-title {
      padding: 14px;
      font-weight: bold;
      font-size: 18px;
      background: #222;
      color: white;
    }

    #searchBox {
      width: 100%;
      padding: 12px;
      border: none;
      border-bottom: 1px solid #ddd;
      outline: none;
      font-size: 14px;
    }

    /* カテゴリーフィルター */
    .filters {
      padding: 10px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .filter-btn {
      border: none;
      padding: 7px 10px;
      border-radius: 20px;
      cursor: pointer;
      background: #eee;
      font-size: 12px;
      transition: 0.2s;
    }

    .filter-btn:hover {
      transform: translateY(-1px);
    }

    .filter-btn.active {
      background: #222;
      color: white;
    }

    /* 検索結果 */
    #searchResults {
      max-height: 220px;
      overflow-y: auto;
    }

    .search-item {
      padding: 12px;
      border-top: 1px solid #eee;
      cursor: pointer;
    }

    .search-item:hover {
      background: #f5f5f5;
    }

    .search-prefecture {
      margin-top: 4px;
      font-size: 12px;
      color: #777;
    }

    /* 詳細サイドパネル */
    #detailPanel {
      position: fixed;
      top: 0;
      right: -430px;
      width: 400px;
      height: 100vh;
      background: white;
      z-index: 2000;
      box-shadow: -5px 0 20px rgba(0,0,0,0.3);
      transition: right 0.3s ease;
      overflow-y: auto;
    }

    #detailPanel.open {
      right: 0;
    }

    #detailContent {
      padding: 25px;
    }

    #closePanel {
      position: sticky;
      top: 10px;
      float: right;
      border: none;
      background: #eee;
      border-radius: 50%;
      width: 38px;
      height: 38px;
      font-size: 24px;
      cursor: pointer;
    }

    .detail-title {
      margin-top: 45px;
      font-size: 24px;
      line-height: 1.4;
    }

    .detail-section {
      margin-top: 25px;
    }

    .detail-section h3 {
      border-left: 5px solid #222;
      padding-left: 10px;
    }

    .warning {
      padding: 15px;
      background: #fff0f0;
      border-radius: 10px;
    }

    .ghost-marker {
      font-size: 28px;
      text-align: center;
    }

    /* スマホ対応 */
    @media (max-width: 600px) {
      .map-ui {
        top: 10px;
        left: 10px;
        width: calc(100% - 20px);
      }

      #detailPanel {
        width: 100%;
        right: -100%;
      }

      #detailPanel.open {
        right: 0;
      }

      .map-title {
        font-size: 16px;
      }

      .filter-btn {
        font-size: 11px;
        padding: 6px 8px;
      }
    }
  </style>
</head>
<body>

<!-- 地図 -->
<div id="map"></div>

<!-- 左上UI -->
<div class="map-ui">
  <div class="map-title">
    👻 日本全国 心霊スポットマップ
  </div>

  <input
    type="text"
    id="searchBox"
    placeholder="スポット名・都道府県・カテゴリーで検索..."
  >

  <div class="filters">
    <button class="filter-btn active" data-category="すべて">すべて</button>
    <button class="filter-btn" data-category="心霊廃墟">👻 廃墟</button>
    <button class="filter-btn" data-category="廃ホテル・旅館">🏨 ホテル</button>
    <button class="filter-btn" data-category="トンネル">🚇 トンネル</button>
    <button class="filter-btn" data-category="山・峠・ダム">🌲 山・ダム</button>
    <button class="filter-btn" data-category="廃観光施設">🎡 観光</button>
    <button class="filter-btn" data-category="歴史・怪談">🏚️ 歴史</button>
  </div>

  <div id="searchResults"></div>
</div>

<!-- 詳細パネル -->
<div id="detailPanel">
  <div id="detailContent"></div>
</div>

<!-- JS Libraries -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>

<script>
  // 地図初期化
  const map = L.map("map", { zoomControl: true }).setView([36.2048, 138.2529], 5);

  // 地図タイル
  L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
    maxZoom: 20,
    attribution: 'Map data &copy; Google'
  }).addTo(map);

  // カテゴリーアイコン
  const icons = {
    "心霊廃墟": "👻",
    "廃ホテル・旅館": "🏨",
    "トンネル": "🚇",
    "山・峠・ダム": "🌲",
    "廃観光施設": "🎡",
    "歴史・怪談": "🏚️"
  };

  // スポットデータ
  const spots = [
    {
      name: "雄別炭鉱跡周辺",
      prefecture: "北海道",
      lat: 43.100,
      lng: 144.050,
      category: "心霊廃墟",
      description: "かつて北海道東部に存在した大規模な炭鉱関連施設跡。\n閉山後、多くの施設が廃墟群となり知られるようになった。",
      phenomena: "・建物内で人影を見るという噂\n・誰もいない場所から話し声が聞こえる\n・夜間に足音が聞こえるという話",
      danger: "危険な廃墟・私有地・管理区域があるため無断侵入禁止"
    },
    {
      name: "恐山",
      prefecture: "青森県",
      lat: 41.2575,
      lng: 141.1067,
      category: "歴史・怪談",
      description: "青森県下北半島にある日本を代表する霊場の一つ。\n火山活動による独特な地形と死者の魂が集まる場所とする信仰で知られる。",
      phenomena: "・霊的な存在を感じるという体験談\n・不思議な声を聞いたという伝承",
      danger: "公開霊場。施設や宗教的な場所への敬意を守ること"
    },
    {
      name: "八王子城跡",
      prefecture: "東京都",
      lat: 35.6570,
      lng: 139.2550,
      category: "歴史・怪談",
      description: "戦国時代に築かれた城跡。1590年の戦いで多くの犠牲者が出たと伝えられている。",
      phenomena: "・夜間に女性の声が聞こえる噂\n・山道で人影を見るという体験談",
      danger: "公開史跡。夜間の山道や危険区域には注意"
    },
    {
      name: "平将門の首塚",
      prefecture: "東京都",
      lat: 35.6883,
      lng: 139.7667,
      category: "歴史・怪談",
      description: "平将門に関する伝承が残る供養地。東京の代表的な都市伝説スポットとして知られる。",
      phenomena: "・祟りに関する都市伝説\n・周辺で不可解な出来事が起きるという伝承",
      danger: "供養地のため敬意を持って見学すること"
    },
    {
      name: "小坪トンネル周辺",
      prefecture: "神奈川県",
      lat: 35.290,
      lng: 139.560,
      category: "トンネル",
      description: "鎌倉・逗子周辺にあるトンネル。関東の代表的な怪談スポットとして紹介される。",
      phenomena: "・女性の霊が現れるという噂\n・バックミラーに人影が映るという話",
      danger: "道路上での停車や周辺への迷惑行為は禁止"
    },
    {
      name: "清滝トンネル周辺",
      prefecture: "京都府",
      lat: 35.050,
      lng: 135.680,
      category: "トンネル",
      description: "京都府内で有名なトンネル。古い山道とともに数多くの怪談が語られている。",
      phenomena: "・トンネル内に女性の霊が現れるという噂\n・車の窓に手形が付くという都市伝説",
      danger: "道路上での停車・周辺住民への迷惑行為禁止"
    },
    {
      name: "旧犬鳴トンネル周辺",
      prefecture: "福岡県",
      lat: 33.720,
      lng: 130.610,
      category: "トンネル",
      description: "福岡県に存在する旧道・トンネル周辺。都市伝説や怪談の題材になっている。",
      phenomena: "・白い服を着た人影を見る噂\n・トンネル内から声が聞こえる話",
      danger: "立入禁止区域・危険な山道があるため侵入しないこと"
    }
  ];

  // マーカークラスター設定
  const markers = L.markerClusterGroup({
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
    disableClusteringAtZoom: 15,
    maxClusterRadius: 50
  });

  const markerObjects = [];

  // スポット移動関数
  function flyToSpot(spot) {
    map.flyTo([spot.lat, spot.lng], 15, { duration: 1.2 });
  }

  // マーカーの生成
  spots.forEach(spot => {
    const emoji = icons[spot.category] || "👻";
    const markerIcon = L.divIcon({
      className: "ghost-marker",
      html: emoji,
      iconSize: [35, 35],
      iconAnchor: [17, 35]
    });

    const marker = L.marker([spot.lat, spot.lng], { icon: markerIcon });

    marker.on("click", () => {
      flyToSpot(spot);
      openDetail(spot);
    });

    markers.addLayer(marker);
    markerObjects.push({ spot, marker });
  });

  map.addLayer(markers);

  // 詳細パネルを開く
  function openDetail(spot) {
    const panel = document.getElementById("detailPanel");
    const content = document.getElementById("detailContent");

    content.innerHTML = `
      <button id="closePanel">×</button>
      <h1 class="detail-title">${escapeHTML(spot.name)}</h1>
      <p>📍 ${escapeHTML(spot.prefecture)}</p>
      <p>🏷 ${escapeHTML(spot.category)}</p>

      <div class="detail-section">
        <h3>📖 スポット概要</h3>
        <p style="white-space:pre-line;">${escapeHTML(spot.description)}</p>
      </div>

      <div class="detail-section">
        <h3>👻 噂される怪奇現象</h3>
        <p style="white-space:pre-line;">${escapeHTML(spot.phenomena)}</p>
      </div>

      <div class="detail-section warning">
        <h3>⚠ 注意事項</h3>
        <p>${escapeHTML(spot.danger)}</p>
      </div>

      <div class="detail-section">
        <small>
          ※怪奇現象は科学的に確認された事実ではありません。<br>
          ※都市伝説・伝承・体験談として紹介しています。<br>
          ※私有地や立入禁止区域への無断侵入は禁止です。
        </small>
      </div>
    `;

    panel.classList.add("open");
    document.getElementById("closePanel").addEventListener("click", closeDetail);
  }

  // 詳細パネルを閉じる
  function closeDetail() {
    document.getElementById("detailPanel").classList.remove("open");
  }

  // エラーを回避するためにUnicode表記で記号を指定するエスケープ処理
  function escapeHTML(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/\u003C/g, "&lt;")  // < の安全な書き方
      .replace(/\u003E/g, "&gt;")  // > の安全な書き方
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // 検索機能
  const searchBox = document.getElementById("searchBox");
  searchBox.addEventListener("input", function() {
    const keyword = this.value.toLowerCase().trim();
    const results = document.getElementById("searchResults");
    results.innerHTML = "";

    if (!keyword) return;

    const filtered = spots.filter(spot => 
      spot.name.toLowerCase().includes(keyword) ||
      spot.prefecture.toLowerCase().includes(keyword) ||
      spot.category.toLowerCase().includes(keyword)
    );

    filtered.slice(0, 20).forEach(spot => {
      const item = document.createElement("div");
      item.className = "search-item";
      item.innerHTML = `
        <b>${escapeHTML(spot.name)}</b>
        <div class="search-prefecture">
          ${escapeHTML(spot.prefecture)} ・ ${escapeHTML(spot.category)}
        </div>
      `;

      item.addEventListener("click", () => {
        flyToSpot(spot);
        openDetail(spot);
        results.innerHTML = "";
        searchBox.value = "";
      });

      results.appendChild(item);
    });
  });

  // カテゴリーフィルター機能
  let activeCategory = "すべて";

  function updateMarkers() {
    markers.clearLayers();
    markerObjects.forEach(item => {
      if (activeCategory === "すべて" || item.spot.category === activeCategory) {
        markers.addLayer(item.marker);
      }
    });
  }

  document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", function() {
      document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
      this.classList.add("active");
      activeCategory = this.dataset.category;
      updateMarkers();
    });
  });

  // ESCキーでパネルを閉じる
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeDetail();
    }
  });
</script>

</body>
</html>