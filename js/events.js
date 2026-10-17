/*
 * 年表に挿入する歴史上の出来事
 * ----------------------------------------------------------------
 * year: 並べ替えに使う年（紀元前はマイナス）
 * label: 表示する年
 * kind: "west"（世界・西洋史） / "church"（教会史） / "japan"（日本史）
 * text: 出来事
 */
const EVENT_KINDS = {
  west:   "世界史",
  church: "教会史",
  japan:  "日本史"
};

const HISTORY_EVENTS = [
  // ---- 古代 ----
  { year: -63,  label: "前63",      kind: "west",   text: "ローマがエルサレムを占領し、ユダヤがローマの支配下に入る" },
  { year: 30,   label: "30頃",      kind: "church", text: "イエスの十字架刑と復活の宣教" },
  { year: 64,   label: "64",        kind: "church", text: "ネロ帝によるキリスト教徒迫害" },
  { year: 70,   label: "70",        kind: "west",   text: "ローマ軍がエルサレム神殿を破壊" },
  { year: 303,  label: "303",       kind: "church", text: "ディオクレティアヌス帝の大迫害" },
  { year: 313,  label: "313",       kind: "church", text: "ミラノ勅令 ― キリスト教が公認される" },
  { year: 325,  label: "325",       kind: "church", text: "第1ニカイア公会議（ニカイア信条）" },
  { year: 380,  label: "380",       kind: "west",   text: "テオドシウス帝、キリスト教をローマ帝国の国教とする" },
  { year: 381,  label: "381",       kind: "church", text: "第1コンスタンティノポリス公会議（ニカイア・コンスタンティノポリス信条）" },
  { year: 395,  label: "395",       kind: "west",   text: "ローマ帝国が東西に分裂" },
  { year: 410,  label: "410",       kind: "west",   text: "西ゴート族がローマを略奪（アウグスティヌス『神の国』執筆の契機）" },
  { year: 431,  label: "431",       kind: "church", text: "エフェソ公会議（マリアを「神の母」と確認）" },
  { year: 451,  label: "451",       kind: "church", text: "カルケドン公会議（キリストの両性論）" },
  { year: 476,  label: "476",       kind: "west",   text: "西ローマ帝国の滅亡" },
  { year: 529,  label: "529頃",     kind: "church", text: "ベネディクトゥスがモンテ・カッシーノ修道院を創設" },

  // ---- 中世 ----
  { year: 622,  label: "622",       kind: "west",   text: "ムハンマドのヒジュラ（イスラームの成立と拡大）" },
  { year: 732,  label: "732",       kind: "west",   text: "トゥール・ポワティエ間の戦い" },
  { year: 787,  label: "787",       kind: "church", text: "第2ニカイア公会議（聖像崇敬の承認）" },
  { year: 800,  label: "800",       kind: "west",   text: "カール大帝の戴冠（西ローマ帝国の復興）" },
  { year: 910,  label: "910",       kind: "church", text: "クリュニー修道院の創設（修道院改革）" },
  { year: 1054, label: "1054",      kind: "church", text: "東西教会の分裂（カトリックと正教会）" },
  { year: 1077, label: "1077",      kind: "west",   text: "カノッサの屈辱（叙任権闘争）" },
  { year: 1096, label: "1096",      kind: "west",   text: "第1回十字軍（〜1099年、エルサレム占領）" },
  { year: 1204, label: "1204",      kind: "west",   text: "第4回十字軍がコンスタンティノポリスを占領・略奪" },
  { year: 1215, label: "1215",      kind: "church", text: "第4ラテラノ公会議（化体説の定式化）／イングランドでマグナ・カルタ" },
  { year: 1309, label: "1309",      kind: "church", text: "教皇のアヴィニョン捕囚（〜1377年）" },
  { year: 1347, label: "1347",      kind: "west",   text: "黒死病（ペスト）がヨーロッパで大流行（〜1351年）" },
  { year: 1378, label: "1378",      kind: "church", text: "教会大分裂（シスマ、〜1417年）" },
  { year: 1414, label: "1414",      kind: "church", text: "コンスタンツ公会議（〜1418年、フスの処刑）" },
  { year: 1453, label: "1453",      kind: "west",   text: "コンスタンティノープル陥落、東ローマ帝国の滅亡" },
  { year: 1455, label: "1455頃",    kind: "west",   text: "グーテンベルクの活版印刷による聖書" },
  { year: 1492, label: "1492",      kind: "west",   text: "コロンブスがアメリカ大陸に到達／レコンキスタの完了" },

  // ---- 宗教改革 ----
  { year: 1517, label: "1517",      kind: "church", text: "ルター『95か条の論題』― 宗教改革の始まり" },
  { year: 1521, label: "1521",      kind: "west",   text: "ヴォルムス帝国議会（ルターの破門と帝国追放）" },
  { year: 1524, label: "1524",      kind: "west",   text: "ドイツ農民戦争（〜1525年）" },
  { year: 1534, label: "1534",      kind: "church", text: "イングランド国王至上法（イングランド国教会の成立）" },
  { year: 1545, label: "1545",      kind: "church", text: "トリエント公会議（〜1563年、カトリック改革）" },
  { year: 1549, label: "1549",      kind: "japan",  text: "フランシスコ・ザビエルが鹿児島に上陸、キリスト教が伝来" },
  { year: 1555, label: "1555",      kind: "west",   text: "アウクスブルクの宗教和議" },
  { year: 1572, label: "1572",      kind: "west",   text: "サン・バルテルミの虐殺（フランスのユグノー迫害）" },
  { year: 1597, label: "1597",      kind: "japan",  text: "日本二十六聖人の殉教（長崎）" },
  { year: 1598, label: "1598",      kind: "west",   text: "ナントの勅令（ユグノーに信仰の自由）" },
  { year: 1614, label: "1614",      kind: "japan",  text: "江戸幕府の禁教令（全国的なキリスト教禁止）" },
  { year: 1618, label: "1618",      kind: "west",   text: "三十年戦争（〜1648年）／ドルト会議（〜1619年）" },
  { year: 1620, label: "1620",      kind: "west",   text: "メイフラワー号のピューリタンが北米に上陸" },
  { year: 1637, label: "1637",      kind: "japan",  text: "島原・天草一揆（〜1638年）" },
  { year: 1639, label: "1639",      kind: "japan",  text: "ポルトガル船の来航禁止（鎖国体制の完成）" },
  { year: 1646, label: "1646",      kind: "church", text: "ウェストミンスター信仰告白" },
  { year: 1648, label: "1648",      kind: "west",   text: "ウェストファリア条約（三十年戦争の終結）" },

  // ---- 近世 ----
  { year: 1688, label: "1688",      kind: "west",   text: "イングランド名誉革命" },
  { year: 1735, label: "1730年代",  kind: "church", text: "北米の大覚醒（信仰復興運動）" },
  { year: 1776, label: "1776",      kind: "west",   text: "アメリカ独立宣言" },
  { year: 1789, label: "1789",      kind: "west",   text: "フランス革命" },

  // ---- 近代 ----
  { year: 1815, label: "1815",      kind: "west",   text: "ウィーン会議（ナポレオン戦争後の体制）" },
  { year: 1848, label: "1848",      kind: "west",   text: "ヨーロッパ各地で革命／『共産党宣言』" },
  { year: 1853, label: "1853",      kind: "japan",  text: "ペリー来航" },
  { year: 1859, label: "1859",      kind: "west",   text: "ダーウィン『種の起源』" },
  { year: 1859.5, label: "1859",    kind: "japan",  text: "プロテスタント宣教師（ヘボンら）が来日" },
  { year: 1868, label: "1868",      kind: "japan",  text: "明治維新" },
  { year: 1869, label: "1869",      kind: "church", text: "第1バチカン公会議（〜1870年、教皇不可謬性の教義）" },
  { year: 1871, label: "1871",      kind: "west",   text: "ドイツ帝国の成立" },
  { year: 1873, label: "1873",      kind: "japan",  text: "キリシタン禁制の高札撤去" },
  { year: 1889, label: "1889",      kind: "japan",  text: "大日本帝国憲法発布（条件付きの信教の自由）" },
  { year: 1910, label: "1910",      kind: "church", text: "エディンバラ世界宣教会議（エキュメニカル運動の出発点）" },

  // ---- 現代 ----
  { year: 1914, label: "1914",      kind: "west",   text: "第一次世界大戦（〜1918年）" },
  { year: 1917, label: "1917",      kind: "west",   text: "ロシア革命" },
  { year: 1933, label: "1933",      kind: "west",   text: "ドイツでナチス政権が成立" },
  { year: 1934, label: "1934",      kind: "church", text: "バルメン神学宣言（告白教会）" },
  { year: 1939, label: "1939",      kind: "west",   text: "第二次世界大戦（〜1945年）" },
  { year: 1941, label: "1941",      kind: "japan",  text: "日本基督教団の成立／太平洋戦争の開戦" },
  { year: 1945, label: "1945",      kind: "japan",  text: "広島・長崎への原爆投下、敗戦" },
  { year: 1948, label: "1948",      kind: "church", text: "世界教会協議会（WCC）の創立／世界人権宣言" },
  { year: 1962, label: "1962",      kind: "church", text: "第二バチカン公会議（〜1965年）" },
  { year: 1967, label: "1967",      kind: "japan",  text: "日本基督教団「戦争責任告白」" },
  { year: 1968, label: "1968",      kind: "west",   text: "キング牧師暗殺／プラハの春／メデジン司教会議（解放の神学）" },
  { year: 1989, label: "1989",      kind: "west",   text: "ベルリンの壁崩壊（冷戦の終結へ）" },
  { year: 1991, label: "1991",      kind: "west",   text: "ソビエト連邦の崩壊" },
  { year: 2001, label: "2001",      kind: "west",   text: "アメリカ同時多発テロ" },
  { year: 2011, label: "2011",      kind: "japan",  text: "東日本大震災・福島第一原子力発電所事故" },
  { year: 2020, label: "2020",      kind: "west",   text: "新型コロナウイルス感染症の世界的流行" }
];
