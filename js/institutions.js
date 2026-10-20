/*
 * 近代以降の重要な神学教育機関
 * ----------------------------------------------------------------
 * id:        半角英数字（URL の #inst-○○ に使われます）
 * name:      名前
 * original:  原語名
 * region:    "ドイツ語圏" / "イギリス" / "フランス・ベルギー・イタリア" / "北米" / "アジア" / "日本"
 * place:     所在地
 * founded:   創立（表示用）
 * tradition: 教派的な背景
 * summary:   解説
 * points:    特徴・歴史のポイント
 * people:    関わった神学者 [id, 関わり方]（id は js/data.js の id）
 *
 * 「関わり方」は、教えた・学んだ・創立・学長 など、その人の解説から確認できる範囲で記しています。
 */
const INST_REGIONS = ["日本", "ドイツ語圏", "イギリス", "フランス・ベルギー・イタリア", "北米", "アジア"];

const INSTITUTIONS = [
  // ===================== ドイツ語圏 =====================
  {
    id: "berlin", name: "ベルリン大学（現フンボルト大学）", original: "Universität zu Berlin (Humboldt-Universität)",
    region: "ドイツ語圏", place: "ドイツ・ベルリン", founded: "1810年", tradition: "国立（プロテスタント神学部）",
    summary: "ヴィルヘルム・フォン・フンボルトの構想により、研究と教育の統一を掲げて創立された近代大学の模範。シュライアマハーが神学部の創設に関わり、神学を大学の学問の一つとして位置づけた。19世紀のドイツ神学・哲学の中心となった。",
    points: ["シュライアマハーは『神学通論』で、神学を教会の指導のための実践的な学問として体系づけた", "ヘーゲル、晩年のシェリングが哲学を講じ、キルケゴールやエンゲルスも聴講した", "ハルナックは教会史家として、また帝政ドイツの学術界の指導者として活躍した", "ボンヘッファーはここで学び、私講師として教えた"],
    people: [["schleiermacher", "神学部創設・教授"], ["hegel", "哲学教授"], ["schelling", "教授（1841年〜）"], ["kierkegaard", "シェリングの講義を聴講"], ["harnack", "教授"], ["troeltsch", "哲学教授"], ["barth", "学生"], ["bonhoeffer", "学生・私講師"]]
  },
  {
    id: "tuebingen", name: "テュービンゲン大学", original: "Eberhard Karls Universität Tübingen",
    region: "ドイツ語圏", place: "ドイツ・テュービンゲン", founded: "1477年", tradition: "国立（プロテスタント・カトリック両神学部）",
    summary: "プロテスタント神学部とカトリック神学部の両方をもつドイツの名門大学。神学生の寮「テュービンゲン神学校（シュティフト）」ではヘーゲル、シェリング、ヘルダーリンが学んだ。19世紀にはF・C・バウアーの「テュービンゲン学派」が聖書の歴史的批判研究を進め、20世紀にはモルトマン、キュング、ユンゲル、ヘンゲルらが活躍した。",
    points: ["19世紀のテュービンゲン学派（バウアー、シュトラウス）は、新約聖書の歴史的批判研究の出発点となった", "カトリックのテュービンゲン学派は、教会と伝統を生きた有機体として捉える神学を展開した", "20世紀後半には、プロテスタント（モルトマン、ユンゲル）とカトリック（キュング、カスパー、ラッツィンガー）の神学者が同じ町で教え、エキュメニカルな神学の拠点となった"],
    people: [["hegel", "神学校で学ぶ"], ["schelling", "神学校で学ぶ"], ["strauss", "学生"], ["moltmann", "教授"], ["jungel", "教授"], ["kung", "教授"], ["kasper", "学生・教授"], ["ratzinger", "教授（1966–69年）"], ["kasemann", "教授"], ["ebeling", "教授"], ["hengel", "教授"], ["volf", "学生（モルトマンに師事）"], ["tsukimoto", "博士号取得"]]
  },
  {
    id: "marburg", name: "マールブルク大学", original: "Philipps-Universität Marburg",
    region: "ドイツ語圏", place: "ドイツ・マールブルク", founded: "1527年", tradition: "国立（プロテスタント神学部）",
    summary: "宗教改革期に創立された、世界で最初のプロテスタントの大学。1529年にはルターとツヴィングリの「マールブルク会談」が行われた。20世紀には、ブルトマンとハイデガーが同時期に教え、実存論的神学と非神話化の拠点となり、多くの神学者・哲学者を育てた。",
    points: ["ブルトマンは1921年から30年間ここで教え、「ポスト・ブルトマン学派」の弟子たちを育てた", "ハイデガーの『存在と時間』はマールブルク時代に書かれ、ブルトマンの神学に直接影響した", "オットーは宗教学・組織神学を教え、『聖なるもの』を著した"],
    people: [["bultmann", "教授（1921–51年）"], ["heidegger", "教授（1923–28年）"], ["otto", "教授"], ["tillich", "教えた"], ["barth", "学生"], ["kasemann", "学生"], ["bornkamm", "学生"], ["ebeling", "学生"], ["gadamer", "学生"], ["arendt", "学生"], ["e-schweizer", "学生"]]
  },
  {
    id: "heidelberg", name: "ハイデルベルク大学", original: "Ruprecht-Karls-Universität Heidelberg",
    region: "ドイツ語圏", place: "ドイツ・ハイデルベルク", founded: "1386年", tradition: "国立（プロテスタント神学部）",
    summary: "ドイツで最も古い大学。宗教改革期には改革派の中心地の一つとなり、1563年に『ハイデルベルク信仰問答』がこの地で作られた。20世紀には、フォン・ラート、ボルンカム、タイセン、ボーレンらが教え、日本からも佐竹明、安炳茂らが留学して学位を得た。",
    points: ["哲学ではヘーゲル、ヤスパース、ガダマーが教えた", "旧約学のフォン・ラート、新約学のボルンカム、タイセンらが国際的な研究を牽引した", "実践神学のボーレンは、加藤常昭を通じて日本の説教学に影響を与えた"],
    people: [["hegel", "教授（1816–18年）"], ["jaspers", "教授"], ["gadamer", "教授"], ["von-rad", "教授"], ["bornkamm", "教授"], ["theissen", "教授"], ["bohren", "教授"], ["pannenberg", "学生"], ["satake-akira", "神学博士号取得"], ["ahn-byung-mu", "博士号取得"], ["kohara", "留学"], ["jenson", "学生"]]
  },
  {
    id: "goettingen", name: "ゲッティンゲン大学", original: "Georg-August-Universität Göttingen",
    region: "ドイツ語圏", place: "ドイツ・ゲッティンゲン", founded: "1737年", tradition: "国立（プロテスタント神学部）",
    summary: "啓蒙主義の時代に創立された研究大学。19世紀後半にはリッチュルが教え、自由主義神学の中心となった。宗教史学派の拠点でもあり、20世紀にはバルト、エレミアス、コンツェルマンらが教えた。",
    points: ["リッチュルと「リッチュル学派」は19世紀末のドイツ神学の主流となった", "宗教史学派（トレルチ、ブセットら）がここで形成された", "若きバルトは最初の教授職をゲッティンゲンで得た（1921–25年）"],
    people: [["ritschl", "教授"], ["troeltsch", "学生"], ["barth", "教授（1921–25年）"], ["jeremias", "教授"], ["conzelmann", "教授"], ["moltmann", "学生"], ["bornkamm", "教授"], ["otto", "学生"]]
  },
  {
    id: "bonn", name: "ボン大学", original: "Rheinische Friedrich-Wilhelms-Universität Bonn",
    region: "ドイツ語圏", place: "ドイツ・ボン", founded: "1818年", tradition: "国立（プロテスタント・カトリック両神学部）",
    summary: "プロテスタントとカトリックの両神学部を持つ大学。バルトはここで教えていた1935年、ヒトラーへの忠誠宣誓を拒んで罷免された。戦後はラッツィンガーも教え、日本からも滝沢克己らがバルトに学ぶために留学した。",
    points: ["バルトは1930年から35年までここで教え、ナチス政権との対決の中で罷免された", "西田幾多郎の勧めで留学した滝沢克己は、ここでバルトに学んだ", "寺園喜基はボン大学で神学博士号を得た"],
    people: [["barth", "教授（1930–35年）"], ["takizawa", "留学（バルトに師事）"], ["ratzinger", "教授"], ["moltmann", "教授"], ["e-schweizer", "教授"], ["terazono", "神学博士号取得"], ["nietzsche", "学生"], ["marx", "学生"]]
  },
  {
    id: "erlangen", name: "エアランゲン大学", original: "Friedrich-Alexander-Universität Erlangen-Nürnberg",
    region: "ドイツ語圏", place: "ドイツ・エアランゲン", founded: "1743年", tradition: "国立（ルター派の伝統の強いプロテスタント神学部）",
    summary: "19世紀には、ルター派の信仰告白を重んじつつ救済史を重視する「エアランゲン学派」の拠点となった。日本からも荒井献、川島貞雄らが留学した。",
    points: ["19世紀のエアランゲン学派（ホフマンら）は、ルター派の信仰告白と救済史の神学を展開した", "荒井献はここで神学博士号を得た"],
    people: [["arai-sasagu", "神学博士号取得"], ["kawashima-sadao", "留学"], ["von-rad", "学生"]]
  },
  {
    id: "munich", name: "ミュンヘン大学", original: "Ludwig-Maximilians-Universität München",
    region: "ドイツ語圏", place: "ドイツ・ミュンヘン", founded: "1472年（インゴルシュタット）、1826年にミュンヘンへ", tradition: "国立（カトリック・プロテスタント両神学部）",
    summary: "カトリック神学の伝統の強いドイツ南部の大学。ラッツィンガーはここで学び、のちに教えた。パネンベルクはプロテスタント神学部で長く教えた。ラテンアメリカのボフや日本の近藤勝彦も学位を得た。",
    points: ["ラーナーは晩年にミュンヘンで教えた", "パネンベルクは歴史としての啓示の神学をここで展開した"],
    people: [["ratzinger", "学生・教授"], ["rahner", "教授"], ["pannenberg", "教授"], ["boff", "博士号取得"], ["kondo-katsuhiko", "博士号取得"]]
  },
  {
    id: "muenster", name: "ミュンスター大学", original: "Westfälische Wilhelms-Universität Münster",
    region: "ドイツ語圏", place: "ドイツ・ミュンスター", founded: "1780年", tradition: "国立（カトリック・プロテスタント両神学部）",
    summary: "カトリック神学部が大きな影響力を持つ大学。メッツが「新しい政治神学」を展開し、ラーナーも晩年に教えた。",
    points: ["メッツは長くここで教え、政治神学を展開した", "シュスラー・フィオレンツァはここで博士号を得た"],
    people: [["metz", "教授"], ["rahner", "教授"], ["schussler-fiorenza", "博士号取得"], ["kasper", "教授"]]
  },
  {
    id: "basel", name: "バーゼル大学", original: "Universität Basel",
    region: "ドイツ語圏", place: "スイス・バーゼル", founded: "1460年", tradition: "国立（プロテスタント神学部）",
    summary: "スイス最古の大学。エラスムスが晩年を過ごした町でもある。20世紀にはドイツを追われたバルトが1935年から1962年まで教え、世界中から神学生が集まる弁証法神学の中心となった。日本からも多くの留学生がバルトに学んだ。",
    points: ["バルトはここで『教会教義学』を書き続けた", "ニーチェは24歳で古典文献学の教授となった", "クルマン、トゥルナイゼンらも教え、トーランス、チャイルズ、ヨーダー、ユンゲルらがバルトのもとで学んだ"],
    people: [["barth", "教授（1935–62年）"], ["nietzsche", "教授"], ["cullmann", "教授"], ["thurneysen", "教授"], ["jaspers", "教授"], ["e-schweizer", "学生（バルトに師事）"], ["bohren", "学生"], ["torrance", "学生（バルトに師事）"], ["childs", "博士号取得"], ["yoder", "学生"], ["jungel", "学生"], ["jenson", "学生"]]
  },
  {
    id: "zurich", name: "チューリッヒ大学", original: "Universität Zürich",
    region: "ドイツ語圏", place: "スイス・チューリッヒ", founded: "1833年（前身は1525年にツヴィングリが開いた神学校）", tradition: "国立（改革派の伝統のプロテスタント神学部）",
    summary: "ツヴィングリが宗教改革期に開いた聖書学校を前身とする大学。20世紀にはブルンナー、エードゥアルト・シュヴァイツァー、エーベリングらが教えた。",
    points: ["ブルンナーは長くここで教え、「出会いとしての真理」の神学を展開した", "エードゥアルト・シュヴァイツァーは新約学を教え、学長も務めた"],
    people: [["brunner", "教授"], ["e-schweizer", "教授・学長"], ["ebeling", "教授"], ["jungel", "教授"], ["zwingli", "前身の神学校を開く"], ["bullinger", "前身の神学校で教える"]]
  },
  {
    id: "bern", name: "ベルン大学", original: "Universität Bern",
    region: "ドイツ語圏", place: "スイス・ベルン", founded: "1834年", tradition: "国立（プロテスタント神学部・キリスト教カトリック神学部）",
    summary: "スイスの首都にある大学。プロテスタント神学部のほかに、復古カトリック（キリスト教カトリック教会）の神学部を持つ。日本から辻学、嶺重淑らが新約学で神学博士号を得た。",
    points: ["ムビティは晩年にここで教えた", "関西学院の新約学者がここで学位を取得している"],
    people: [["tsuji-manabu", "神学博士号取得"], ["mineshige-kiyoshi", "神学博士号取得"], ["mbiti", "教えた"]]
  },

  // ===================== イギリス =====================
  {
    id: "oxford", name: "オックスフォード大学", original: "University of Oxford",
    region: "イギリス", place: "イギリス・オックスフォード", founded: "12世紀", tradition: "英国国教会の伝統（現在は多宗派）",
    summary: "英語圏最古の大学。ウィクリフ、ウェスレー兄弟の「ホーリー・クラブ」、19世紀のオックスフォード運動（ニューマン）など、英国の教会史の重要な運動の舞台となった。20世紀にはC・S・ルイス、マッコーリー、マクグラス、N・T・ライトらが教えた。",
    points: ["オックスフォード運動は英国国教会の中にカトリック的伝統を回復しようとした", "ルイスはトールキンらと「インクリングズ」の集まりを持った", "神学と科学、歴史的イエス研究、教父学などで国際的な研究拠点となっている"],
    people: [["wycliffe", "教えた"], ["wesley", "学生・フェロー（ホーリー・クラブ）"], ["owen", "副総長"], ["newman", "フェロー・説教者（オックスフォード運動）"], ["lewis", "教えた"], ["macquarrie", "教授"], ["mcgrath", "学生・教授"], ["nt-wright", "学生・教えた"], ["rowan-williams", "学生・教授"], ["webster", "教授"], ["vermes", "教えた"], ["sanders", "教えた"], ["borg", "博士号取得"], ["coakley", "教えた"], ["ware", "教えた"], ["dodd", "学生・教えた"]]
  },
  {
    id: "cambridge", name: "ケンブリッジ大学", original: "University of Cambridge",
    region: "イギリス", place: "イギリス・ケンブリッジ", founded: "1209年", tradition: "英国国教会の伝統（現在は多宗派）",
    summary: "宗教改革期にはブツァーが教え、英国の宗教改革とピューリタン運動の拠点の一つとなった。20世紀にはドッド、ムール、ポーキングホーン、ローワン・ウィリアムズらが教え、新約学の国際的な拠点となった。ジェイムズ・D・G・ダンはムールのもとで学位を得た。",
    points: ["ブツァーは晩年ここで教え、英国の宗教改革に影響を与えた", "ムールのもとで多くの新約学者が育った", "ウィトゲンシュタインが哲学を教えた"],
    people: [["bucer", "教授"], ["dodd", "教授"], ["moule", "教授"], ["polkinghorne", "教授・学長"], ["rowan-williams", "学生・教授"], ["coakley", "教授"], ["milbank", "学生・教えた"], ["dunn", "博士号取得（ムールに師事）"], ["newbigin", "学生"], ["stott", "学生"], ["wittgenstein", "教授"], ["lewis", "教授（1954年〜）"], ["barrett", "学生"], ["ja-robinson", "学生・教えた"], ["hick", "教えた"]]
  },
  {
    id: "edinburgh", name: "エディンバラ大学（ニュー・カレッジ）", original: "University of Edinburgh, New College",
    region: "イギリス", place: "スコットランド・エディンバラ", founded: "1583年（ニュー・カレッジは1846年）", tradition: "スコットランド教会（長老派）の伝統",
    summary: "スコットランドの長老派の神学教育の中心。1910年のエディンバラ世界宣教会議の会場となり、エキュメニカル運動の出発点となった。20世紀にはトーランスがバルト神学の英語圏への紹介の拠点とした。",
    points: ["1910年の世界宣教会議は、世界キリスト教研究とエキュメニカル運動の源流となった", "トーランスはここで長く教え、バルトの『教会教義学』の英訳を監修した", "ハータドは新約学・初期キリスト教研究の拠点を築いた"],
    people: [["torrance", "学生・教授"], ["hurtado", "教授"], ["hume", "学生"], ["hick", "学生"]]
  },
  {
    id: "durham", name: "ダラム大学", original: "Durham University",
    region: "イギリス", place: "イングランド・ダラム", founded: "1832年", tradition: "英国国教会の伝統",
    summary: "イングランド北部の大学で、新約学のライトフット講座で知られる。バレット、ダンらが教え、英国の新約学の重要な拠点となった。",
    points: ["バレットは長く新約学を教えた", "ダンはライトフット講座教授として「パウロ研究の新しい視点」を展開した"],
    people: [["barrett", "教授"], ["dunn", "ライトフット講座教授"], ["webster", "教えた"]]
  },
  {
    id: "aberdeen", name: "アバディーン大学", original: "University of Aberdeen",
    region: "イギリス", place: "スコットランド・アバディーン", founded: "1495年", tradition: "スコットランド教会の伝統",
    summary: "スコットランド北部の古い大学。P・T・フォーサイスが学び、ウェブスターが教えた。アフリカのベディアコもここで博士号を得た。",
    points: ["改革派の伝統に立つ教義学の拠点の一つ"],
    people: [["forsyth", "学生"], ["webster", "教授"], ["bediako", "博士号取得"], ["ff-bruce", "学生"]]
  },

  // ===================== フランス・ベルギー・イタリア =====================
  {
    id: "st-sergius", name: "聖セルギイ正教神学院", original: "Institut de théologie orthodoxe Saint-Serge",
    region: "フランス・ベルギー・イタリア", place: "フランス・パリ", founded: "1925年", tradition: "東方正教会（ロシア正教会の亡命者）",
    summary: "ロシア革命後にパリへ亡命した神学者たちが創立した正教会の神学校。フロロフスキー、ブルガーコフらが教え、正教会の神学を西方世界に伝える拠点となった。シュメーマンもここで学び教えたのち、米国に渡った。",
    points: ["亡命ロシア人の神学（新教父学的総合、ソフィア論）の中心となった", "エキュメニカル運動に正教会が参加する窓口となった"],
    people: [["florovsky", "教授"], ["schmemann", "学生・教えた"], ["berdyaev", "パリで活動"]]
  },
  {
    id: "fourviere", name: "リヨン・フルヴィエールのイエズス会神学院", original: "Scolasticat jésuite de Lyon-Fourvière",
    region: "フランス・ベルギー・イタリア", place: "フランス・リヨン", founded: "20世紀前半", tradition: "カトリック（イエズス会）",
    summary: "リヨンのイエズス会の神学院。ド・リュバックらが教父と中世の源泉に立ち帰る「新神学」を展開し、叢書『キリスト教源泉（Sources Chrétiennes）』を創刊した。バルタザールもここで学んだ。",
    points: ["「源泉回帰」の運動は、第二バチカン公会議の神学的な土台となった"],
    people: [["de-lubac", "教授"], ["balthasar", "学生"]]
  },
  {
    id: "saulchoir", name: "ル・ソルショワール（ドミニコ会神学院）", original: "Le Saulchoir",
    region: "フランス・ベルギー・イタリア", place: "ベルギー（のちフランス・エティオル）", founded: "1904年", tradition: "カトリック（ドミニコ会）",
    summary: "フランスのドミニコ会の神学院。トマス・アクィナスを歴史的に研究する方法をとり、コンガールやシュニュらが教えた。シュニュの著作は教皇庁から問題とされたが、その方法は第二バチカン公会議に影響を与えた。",
    points: ["コンガールはここでエキュメニズムと教会論の研究を始めた"],
    people: [["congar", "教授"], ["schillebeeckx", "学生"]]
  },
  {
    id: "louvain", name: "ルーヴァン・カトリック大学", original: "Université catholique de Louvain / KU Leuven",
    region: "フランス・ベルギー・イタリア", place: "ベルギー・ルーヴァン", founded: "1425年", tradition: "カトリック",
    summary: "ベルギーの名門カトリック大学。宗教改革期にはエラスムスと関わり、20世紀にはカトリック神学と哲学の国際的な拠点となった。グティエレスもここで学んだ。",
    points: ["1968年に、フランス語系とオランダ語系の二つの大学に分かれた"],
    people: [["erasmus", "滞在・三言語学院の設立に関与"], ["gutierrez", "学生"], ["schillebeeckx", "学生"]]
  },
  {
    id: "gregorian", name: "教皇庁立グレゴリアン大学", original: "Pontificia Università Gregoriana",
    region: "フランス・ベルギー・イタリア", place: "イタリア・ローマ", founded: "1551年（ローマ学院）", tradition: "カトリック（イエズス会）",
    summary: "イグナチオ・デ・ロヨラが創立したローマ学院を前身とする、イエズス会のカトリック大学。世界中から司祭・神学生が集まる。ベラルミーノが教え、20世紀にはロナガンが教えた。",
    points: ["キュングやマイヤーはここで学んだ"],
    people: [["loyola", "前身のローマ学院を創立"], ["bellarmine", "教授"], ["lonergan", "教授"], ["kung", "学生"], ["meier", "学生"]]
  },

  // ===================== 北米 =====================
  {
    id: "union-ny", name: "ユニオン神学校（ニューヨーク）", original: "Union Theological Seminary in the City of New York",
    region: "北米", place: "アメリカ・ニューヨーク", founded: "1836年", tradition: "超教派（長老派に由来するリベラル・プロテスタント）",
    summary: "ニューヨーク・マンハッタンの超教派の神学校で、20世紀アメリカのリベラル・プロテスタント神学と社会倫理の中心。ラインホールド・ニーバー、ティリッヒ、コーンらが教え、ボンヘッファーも留学した。日本からも多くの神学者・牧師が学び、日本の神学と教会に大きな影響を与えた。",
    points: ["ニーバーのキリスト教現実主義、ティリッヒの相関の神学、コーンの黒人神学の拠点となった", "フェミニスト神学（ゼレ、チョン・ヒョンギョン）、ヨハネ研究（マーティン、ブラウン）でも知られる", "武田清子、土肥昭夫、土戸清、小山晃佑ら日本の学者・牧師も多く学んだ"],
    people: [["r-niebuhr", "教授"], ["tillich", "教授"], ["cone", "教授"], ["williams-delores", "教授"], ["solle", "教授"], ["martyn", "教授"], ["raymond-brown", "教授"], ["chung-hyun-kyung", "教授"], ["koyama", "教授"], ["bonhoeffer", "留学"], ["brunner", "学生"], ["miguez-bonino", "博士号取得"], ["takeda-kiyoko", "学生（ニーバーに師事）"], ["oki-hideo", "学生（ニーバーに師事）"], ["dohi", "学生"], ["tsuchido-kiyoshi", "学生（S.T.M.）"], ["kawashima-sadao", "修士課程修了"]]
  },
  {
    id: "princeton-ts", name: "プリンストン神学校", original: "Princeton Theological Seminary",
    region: "北米", place: "アメリカ・ニュージャージー州プリンストン", founded: "1812年", tradition: "長老派",
    summary: "米国長老派の代表的な神学校。19世紀にはホッジらの「プリンストン神学」が改革派正統主義と聖書の無誤性を擁護した。20世紀にはフロマートカ、ミグリオリらが教え、バルト研究の拠点ともなった。日本からも賀川豊彦、森本あんりらが学んだ。",
    points: ["プリンストン神学は北米の福音派・原理主義の議論に大きな影響を与えた", "1929年の分裂で保守派がウェストミンスター神学校を創立した", "日本の改革派・長老派の神学者・牧師の多くが学んだ"],
    people: [["hodge", "教授"], ["vos", "聖書神学教授（1893–1932年）"], ["machen", "新約学教授（1906–29年）"], ["van-til", "学生・教えた（1928–29年）"], ["john-murray", "学生・教えた（1929–30年）"], ["migliore", "教授"], ["hromadka", "亡命中に教えた"], ["kagawa", "留学"], ["koyama", "博士号取得"], ["morimoto-anri", "博士号取得"], ["furuya", "学生"], ["childs", "学生"], ["jenson", "神学研究センター所長"]]
  },
  {
    id: "yale", name: "イェール大学神学部", original: "Yale Divinity School",
    region: "北米", place: "アメリカ・コネティカット州ニューヘイヴン", founded: "1822年", tradition: "超教派（会衆派に由来）",
    summary: "イェール大学の神学部。H・リチャード・ニーバーが倫理学を教え、フライとリンドベックによる「イェール学派」（ポストリベラル神学）の拠点となった。チャイルズの正典的アプローチ、ヴォルフの公共神学なども生まれた。",
    points: ["ポストリベラル神学（イェール学派）の拠点", "ジョナサン・エドワーズはイェール大学の出身", "ゴンサレスは歴史神学の博士号を最年少で取得した"],
    people: [["h-r-niebuhr", "教授"], ["frei", "教授"], ["lindbeck", "教授"], ["childs", "教授"], ["tanner", "教授"], ["volf", "教授"], ["sanneh", "教授"], ["hays", "教えた"], ["r-niebuhr", "学生"], ["hauerwas", "学生"], ["willimon", "学生"], ["gonzalez", "博士号取得"], ["mcfague", "博士号取得"], ["edwards", "学生"], ["martyn", "博士号取得"]]
  },
  {
    id: "westminster", name: "ウエストミンスター神学校", original: "Westminster Theological Seminary",
    region: "北米", place: "アメリカ・ペンシルヴェニア州フィラデルフィア（グレンサイド）", founded: "1929年", tradition: "改革派・長老派（正統長老教会など）",
    summary: "プリンストン神学校の改組を自由主義神学への妥協とみなしたメイチェンが、ヴァン・ティル、ウィルソン、アリスらと共に1929年に創立した改革派の神学校。ウエストミンスター信仰告白に立つ改革派正統主義を掲げ、前提主義弁証学（ヴァン・ティル）、釈義的組織神学（マーレー）、聖書神学とキリスト中心の説教（クラウニー）、契約神学（クライン）などの伝統を生んだ。北米の改革派・福音派の神学教育の重要な拠点であり、1980年にはカリフォルニア校が設立された。",
    points: ["1920年代の原理主義・近代主義論争の中で、旧プリンストン神学の伝統を受け継ぐために創立された", "創立者メイチェンは、のちに正統長老教会の創立を導いた", "ヴォスの聖書神学の伝統が、マーレー、クラウニー、ガフィン、クラインらによって展開された", "ジェイ・アダムズの聖書的カウンセリング、ティモシー・ケラーの都市宣教など、実践神学でも影響を与えた"],
    people: [["machen", "創立者・新約学教授"], ["van-til", "創立教授（弁証学）"], ["john-murray", "組織神学教授（1930–66年）"], ["clowney", "初代学長・実践神学教授"], ["kline", "旧約学教授"], ["jay-adams", "実践神学教授"], ["keller", "実践神学を教えた"], ["schaeffer", "学生"]]
  },
  {
    id: "harvard-ds", name: "ハーバード神学校", original: "Harvard Divinity School",
    region: "北米", place: "アメリカ・マサチューセッツ州ケンブリッジ", founded: "1816年", tradition: "超教派（ユニテリアンに由来）",
    summary: "ハーバード大学の神学校。超教派・宗教間対話の色彩が強く、ステンダールが学部長を務めた。ティリッヒ、コックス、シュスラー・フィオレンツァ、コークリーらが教えた。",
    points: ["ステンダールは学部長として、ユダヤ教との対話と「聖なる妬み」を説いた", "ウィリアム・ジェイムズはハーバード大学で宗教心理学の古典を著した"],
    people: [["stendahl", "教授・学部長"], ["tillich", "大学教授"], ["cox", "教授"], ["schussler-fiorenza", "教授"], ["coakley", "教授"], ["florovsky", "教えた"], ["nouwen", "教えた"], ["w-james", "（ハーバード大学教授）"], ["zizioulas", "学生"], ["kwok", "博士号取得"]]
  },
  {
    id: "chicago", name: "シカゴ大学神学部", original: "University of Chicago Divinity School",
    region: "北米", place: "アメリカ・イリノイ州シカゴ", founded: "1890年代（シカゴ大学の創立とともに）", tradition: "超教派（バプテストに由来）",
    summary: "シカゴ大学の神学部。宗教学・宗教哲学と神学の対話の拠点で、ティリッヒ、リクール、マリオンらが教えた。プロセス神学（ハーツホーン）の拠点の一つでもあった。",
    points: ["宗教学（エリアーデら）と神学が並び立つ学風で知られる"],
    people: [["tillich", "教授"], ["ricoeur", "教授"], ["marion", "教授"], ["hartshorne", "教授"], ["tanner", "教えた"]]
  },
  {
    id: "duke", name: "デューク大学神学部", original: "Duke Divinity School",
    region: "北米", place: "アメリカ・ノースカロライナ州ダーラム", founded: "1926年", tradition: "合同メソジスト教会",
    summary: "合同メソジスト教会の神学校の一つ。ハワーワスが神学的倫理を、ヘイズが新約学を教え、ウィリモンが大学チャペルの学部長を務めた。ポストリベラル神学・神学的倫理・説教学の拠点。",
    points: ["ハワーワスとウィリモンの共著『旅する神の民』はここから生まれた"],
    people: [["hauerwas", "教授"], ["willimon", "チャペル学部長・教授"], ["hays", "教授・学部長"], ["sanders", "教授"]]
  },
  {
    id: "emory", name: "エモリー大学キャンドラー神学部", original: "Candler School of Theology, Emory University",
    region: "北米", place: "アメリカ・ジョージア州アトランタ", founded: "1914年", tradition: "合同メソジスト教会",
    summary: "合同メソジスト教会の神学校の一つ。ゴンサレスが教会史を教え、ヒスパニック神学教育の拠点となった。",
    points: ["ヘイズ、ウィリモンらもエモリー大学で学位を得た"],
    people: [["gonzalez", "教授"], ["hays", "博士号取得"], ["willimon", "学位取得"], ["kwok", "教授"]]
  },
  {
    id: "fuller", name: "フラー神学校", original: "Fuller Theological Seminary",
    region: "北米", place: "アメリカ・カリフォルニア州パサデナ", founded: "1947年", tradition: "超教派（福音派）",
    summary: "戦後アメリカの「新福音派」の拠点として創立された神学校。カール・ヘンリーが創立教授の一人。宣教学（世界宣教学部）でも知られ、ヴォルフ、ヨンらが教えた。",
    points: ["福音派の学問的・社会的関与の拠点となった"],
    people: [["henry", "創立教授"], ["volf", "教えた"], ["yong", "教授・学部長"]]
  },
  {
    id: "notre-dame", name: "ノートルダム大学", original: "University of Notre Dame",
    region: "北米", place: "アメリカ・インディアナ州", founded: "1842年", tradition: "カトリック（聖十字架修道会）",
    summary: "米国を代表するカトリック大学。神学・哲学で、ヨーダー、ハワーワス、マイヤー、マッキンタイア、プランティンガらが教えた。",
    points: ["カトリック・プロテスタント双方の神学者・哲学者が教える"],
    people: [["yoder", "教授"], ["hauerwas", "教授"], ["meier", "教授"], ["macintyre", "教授"], ["plantinga", "教授"], ["schussler-fiorenza", "教えた"]]
  },
  {
    id: "regent", name: "リージェント・カレッジ", original: "Regent College",
    region: "北米", place: "カナダ・バンクーバー", founded: "1970年", tradition: "超教派（福音派）",
    summary: "信徒の神学教育を目的に創立された福音派の大学院。霊性神学の分野で知られ、ユージン・H・ピーターソンが教えた。",
    points: ["信徒が職業生活の中で神学を学ぶ「信徒神学」を重んじる"],
    people: [["eh-peterson", "霊性神学教授"]]
  },
  {
    id: "drew", name: "ドルー大学神学部", original: "Drew Theological School",
    region: "北米", place: "アメリカ・ニュージャージー州", founded: "1867年", tradition: "合同メソジスト教会",
    summary: "メソジストの神学校。小山晃佑が学び、デロレス・ウィリアムズが教えた。",
    points: [],
    people: [["koyama", "学生"], ["williams-delores", "教えた"]]
  },
  {
    id: "chicago-ts", name: "シカゴ神学校", original: "Chicago Theological Seminary",
    region: "北米", place: "アメリカ・イリノイ州シカゴ", founded: "1855年", tradition: "合同キリスト教会（会衆派に由来）",
    summary: "会衆派の伝統に立つシカゴの神学校。日本から越川弘英が学んだ。",
    points: [],
    people: [["koshikawa-hirohide", "卒業"]]
  },

  // ===================== アジア =====================
  {
    id: "hanshin", name: "韓神大学校", original: "Hanshin University",
    region: "アジア", place: "韓国", founded: "1940年（朝鮮神学院）", tradition: "大韓基督教長老会",
    summary: "韓国の長老派の神学校。1970年代の民主化運動の中で、安炳茂らが民衆神学を展開する拠点となった。",
    points: ["民衆神学の拠点"],
    people: [["ahn-byung-mu", "教授"]]
  },
  {
    id: "yonsei", name: "延世大学校神学部", original: "Yonsei University College of Theology",
    region: "アジア", place: "韓国・ソウル", founded: "1915年", tradition: "超教派（プロテスタント）",
    summary: "韓国を代表するキリスト教主義の私立大学。徐南同が教え、民衆神学の形成に関わった。",
    points: [],
    people: [["suh-nam-dong", "教授"]]
  },

  // ===================== 日本 =====================
  {
    id: "doshisha", name: "同志社大学神学部", original: "Doshisha University School of Theology",
    region: "日本", place: "京都", founded: "1875年（同志社英学校）", tradition: "会衆派（組合教会）の伝統",
    summary: "新島襄が創立した同志社英学校以来の伝統をもつ神学部。熊本バンドの青年たちが学び、組合教会の指導者を多く送り出した。自由主義神学の伝統を持ち、今日は一神教研究、日本キリスト教史などで知られる。",
    points: ["熊本バンド（海老名弾正、小崎弘道ら）がここで学んだ", "韓国の徐南同もここで神学を学んだ", "近年はキリスト教・ユダヤ教・イスラームの一神教研究の拠点となっている"],
    people: [["niijima", "創立者"], ["kozaki", "学生・第2代社長"], ["ebina", "学生・総長"], ["kashiwagi", "学生"], ["yamamuro", "学生"], ["suh-nam-dong", "学生"], ["dohi", "学生・教授"], ["kohara", "学生・教授・学長"], ["koshikawa-hirohide", "学生・キリスト教文化センター"], ["horie-yuri", "学生"], ["kudo-marie", "学生"]]
  },
  {
    id: "tokyo-ts", name: "東京神学大学（前身：東京神学社・日本神学校）", original: "Tokyo Union Theological Seminary",
    region: "日本", place: "東京", founded: "1943年（1949年に東京神学大学）／前身の東京神学社は1904年", tradition: "日本基督教団",
    summary: "植村正久の東京神学社（1904年）、高倉徳太郎が校長を務めた日本神学校などを前身とし、戦時下の1943年に諸教派の神学校を統合して成立した日本基督教団の神学校。戦後、1949年に東京神学大学となった。バルト神学の受容の中心となり、日本のプロテスタント神学の主流を形成した。",
    points: ["東京神学社（植村正久）・日本神学校（高倉徳太郎）の福音主義の伝統を受け継ぐ", "熊野義孝、桑田秀延、北森嘉蔵、大木英夫らが日本の組織神学を形成した", "加藤常昭の説教学、松永希久夫・小友聡らの聖書学など、教会の伝道者養成に重点を置く"],
    people: [["uemura", "東京神学社を創立"], ["takakura", "日本神学校校長"], ["kumano", "教授"], ["kuwada", "初代学長"], ["kitamori", "教授"], ["oki-hideo", "教授・学長"], ["inoue-yoshio", "教えた"], ["kato-tsuneaki", "教授"], ["matsunaga", "教授"], ["kondo-katsuhiko", "教授・学長"], ["haga", "教授・学長"], ["otomo", "教授"], ["suzuki-masahisa", "日本神学校で学ぶ"], ["koyama", "学生"], ["tsuchido-kiyoshi", "大学院修了"], ["morimoto-anri", "学生"], ["akaiwa", "東京神学社で学ぶ"]]
  },
  {
    id: "kwansei", name: "関西学院大学神学部", original: "Kwansei Gakuin University School of Theology",
    region: "日本", place: "兵庫県西宮", founded: "1889年", tradition: "メソジスト",
    summary: "米国南メソジスト監督教会の宣教師ランバスが創立した関西学院の神学部。メソジストの伝統に立ち、日本基督教団の伝道者を養成する。聖書学、実践神学、解放の神学（栗林輝夫の荊冠の神学）などで知られる。",
    points: ["新約学・旧約学でベルン大学などに留学した研究者が多い", "部落解放の視点からの神学（荊冠の神学）を生んだ"],
    people: [["kuribayashi", "教授"], ["tsuji-manabu", "学生・教員"], ["mizuno-ryuichi", "学生・教授"], ["mineshige-kiyoshi", "学生・教員"], ["higuchi-susumu", "学生・教授"]]
  },
  {
    id: "aoyama", name: "青山学院", original: "Aoyama Gakuin",
    region: "日本", place: "東京", founded: "1874年", tradition: "メソジスト",
    summary: "米国メソジスト監督教会の宣教師によって創立された学校。本多庸一が院長を務めた。文学部神学科は日本のメソジストの伝道者と聖書学者を育てたが、1977年に廃止された。",
    points: ["高柳伊三郎、川島貞雄、関田寛雄、大島力ら聖書学・実践神学の教員が教えた", "神学科の廃止は、大学紛争と教会・大学の関係をめぐる議論の中で行われた"],
    people: [["honda-yoichi", "院長"], ["kawashima-sadao", "大学院・専任講師"], ["sekita", "教授"], ["oshima-chikara", "教授"], ["noro", "学生・教えた"], ["satake-akira", "教授"]]
  },
  {
    id: "rikkyo", name: "立教大学", original: "Rikkyo University",
    region: "日本", place: "東京", founded: "1874年", tradition: "日本聖公会",
    summary: "米国聖公会の宣教師ウィリアムズが創立した立教学校に始まる大学。キリスト教学科・大学院キリスト教学研究科で、聖書学・組織神学・聖公会神学を教える。",
    points: [],
    people: [["nishihara", "教授・総長"], ["sato-migaku", "教授"], ["tsukimoto", "教授"], ["noro", "教授"], ["kudo-marie", "博士号取得"]]
  },
  {
    id: "sophia", name: "上智大学神学部", original: "Sophia University Faculty of Theology",
    region: "日本", place: "東京", founded: "1913年（神学部は1958年）", tradition: "カトリック（イエズス会）",
    summary: "イエズス会が創立したカトリック大学。神学部はカトリック司祭の養成と神学研究の拠点で、中世思想研究所を持つ。",
    points: ["中世思想研究所はリーゼンフーバーのもとで日本の中世哲学研究の拠点となった"],
    people: [["riesenhuber", "教授・中世思想研究所長"], ["kadowaki", "教授"], ["yoshimitsu", "教えた"], ["tsukimoto", "特任教授"]]
  },
  {
    id: "icu", name: "国際基督教大学（ICU）", original: "International Christian University",
    region: "日本", place: "東京都三鷹", founded: "1953年", tradition: "超教派（プロテスタント）",
    summary: "戦後、日米のキリスト者の協力によって創立された大学。ブルンナーが草創期に教え、武田清子、古屋安雄、森本あんりらが日本のキリスト教思想史・神学を教えた。",
    points: ["リベラルアーツ教育とキリスト教の対話を重んじる"],
    people: [["brunner", "教授（1953–55年）"], ["takeda-kiyoko", "教授"], ["furuya", "教授"], ["morimoto-anri", "学生・教授・学長"], ["aono", "学生"]]
  },
  {
    id: "seinan", name: "西南学院大学神学部", original: "Seinan Gakuin University School of Theology",
    region: "日本", place: "福岡", founded: "1916年", tradition: "バプテスト",
    summary: "米国南部バプテストの宣教師によって創立された西南学院の神学部。日本バプテスト連盟の伝道者を養成する。",
    points: [],
    people: [["terazono", "学生・教授・院長"], ["aono", "教授"]]
  },
  {
    id: "tohoku-gakuin", name: "東北学院", original: "Tohoku Gakuin",
    region: "日本", place: "宮城県仙台", founded: "1886年", tradition: "改革派（米国ドイツ改革派教会）",
    summary: "米国ドイツ改革派教会の宣教師と押川方義によって創立された仙台の学校。土戸清が新約学を教え、松本宣郎が学長・院長を務めた。",
    points: [],
    people: [["tsuchido-kiyoshi", "教授"], ["matsumoto-nobuo", "学長・院長"]]
  },
  {
    id: "jbts", name: "日本聖書神学校", original: "Japan Biblical Seminary",
    region: "日本", place: "東京", founded: "20世紀", tradition: "日本基督教団",
    summary: "日本基督教団の認可神学校の一つで、夜間を中心に、働きながら学ぶ献身者の伝道者養成を行ってきた。",
    points: [],
    people: [["kawashima-sadao", "教授"]]
  },
  {
    id: "lutheran", name: "ルーテル学院大学・日本ルーテル神学校", original: "Japan Lutheran College / Japan Lutheran Theological Seminary",
    region: "日本", place: "東京都三鷹", founded: "1909年（熊本）", tradition: "日本福音ルーテル教会",
    summary: "日本のルター派の神学校。熊本で創立され、のちに東京に移った。北森嘉蔵はその前身で学び、徳善義和がルター研究所の所長として日本のルター研究を牽引した。",
    points: [],
    people: [["tokuzen", "教授・ルター研究所長"], ["kitamori", "前身の神学校で学ぶ"]]
  },
  {
    id: "noden", name: "農村伝道神学校", original: "Nōson Dendō Theological Seminary",
    region: "日本", place: "東京都町田市（鶴川）", founded: "1948年", tradition: "日本基督教団（認可神学校）",
    summary: "カナダ合同教会の宣教師アルフレッド・R・ストーンが、農村・地方教会に仕える伝道者を養成するために1948年に東京の日野町で創立した訓練センターに始まる神学校。都市化に伴って町田市鶴川の森の中に移り、農業実習や地域での活動を取り入れた独自の神学教育を行ってきた。エキュメニカルな姿勢に立ち、沖縄・アジアとの関わりや戦争責任の問題、差別からの解放をめぐる講座などにも力を入れている。",
    points: ["「農村、地方教会に仕える伝道者の育成」を目的に掲げる", "1960年に始まった東南アジア科は、のちに独立してアジア学院（アジア農村指導者養成専門学校）となった", "紀要『福音と社会』を発行している", "日本基督教団総会議長を務めた武藤健が校長を務めた時期がある"],
    people: [["a-r-stone", "創立者・初代校長"], ["sato-migaku", "講師（禅キリスト教の瞑想）"]]
  },
  {
    id: "tbts", name: "東京バプテスト神学校", original: "Tokyo Baptist Theological Seminary",
    region: "日本", place: "東京（2025年にさいたま市南浦和の日本バプテスト連盟会館内へ移転）", founded: "1962年", tradition: "日本バプテスト連盟",
    summary: "日本バプテスト連盟の東京地方の諸教会が設置する神学校。1962年に「東京バプテスト福音宣教学院」として発足し、1967年に現在の名称となった。働きながら学ぶ人のための夜間の神学校として始まり、信徒の神学教育・教会教育・教会音楽の教育にも力を入れている。現在は教室・オンライン・録画を組み合わせた多様な形で学ぶことができる。",
    points: ["1967年に神学科・教会教育科・教会音楽科を設けた", "1998年に米国のサウスウェスタン・バプテスト神学校と協力関係を結んだ", "信徒リーダー養成や教会音楽奉仕者の講座など、信徒の学びを重視する", "東京地方バプテスト教会連合など三つの連合・連合会が設置・運営している"],
    people: [["jokura-kei", "教務・講師（ヘブル語・旧約聖書学）"]]
  },
  {
    id: "tci", name: "東京基督教大学", original: "Tokyo Christian University",
    region: "日本", place: "千葉県印西", founded: "1990年", tradition: "超教派（福音派）",
    summary: "日本の福音派の諸教会が支える神学大学。稲垣久和が公共哲学とキリスト教の研究を進めた。",
    points: [],
    people: [["inagaki", "教授"]]
  },
  {
    id: "ctsj", name: "聖公会神学院", original: "Central Theological College",
    region: "日本", place: "東京", founded: "1911年", tradition: "日本聖公会",
    summary: "日本聖公会の司祭を養成する神学校。",
    points: [],
    people: [["nishihara", "学生"]]
  }
];
