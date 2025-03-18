export interface WorldCountry {
  name: string;
  iso: string;
  dialCode: string;
  areaCodes?: string[];
}

export const WORLD_COUNTRIES: Record<string, WorldCountry> = {
  AF: {
    name: "Afghanistan",
    iso: "af",
    dialCode: "93",
  },
  AX: {
    name: "Åland Islands",
    iso: "ax",
    dialCode: "358",
  },
  AL: {
    name: "Albania",
    iso: "al",
    dialCode: "355",
  },
  DZ: {
    name: "Algeria",
    iso: "dz",
    dialCode: "213",
  },
  AS: {
    name: "American Samoa",
    iso: "as",
    dialCode: "1684",
  },
  AD: {
    name: "Andorra",
    iso: "ad",
    dialCode: "376",
  },
  AO: {
    name: "Angola",
    iso: "ao",
    dialCode: "244",
  },
  AI: {
    name: "Anguilla",
    iso: "ai",
    dialCode: "1264",
  },
  AQ: {
    name: "Antarctica",
    iso: "aq",
    dialCode: "672",
  },
  AG: {
    name: "Antigua and Barbuda",
    iso: "ag",
    dialCode: "1268",
  },
  AR: {
    name: "Argentina",
    iso: "ar",
    dialCode: "54",
  },
  AM: {
    name: "Armenia",
    iso: "am",
    dialCode: "374",
  },
  AW: {
    name: "Aruba",
    iso: "aw",
    dialCode: "297",
  },
  AU: {
    name: "Australia",
    iso: "au",
    dialCode: "61",
  },
  AT: {
    name: "Austria",
    iso: "at",
    dialCode: "43",
  },
  AZ: {
    name: "Azerbaijan",
    iso: "az",
    dialCode: "994",
  },
  BS: {
    name: "Bahamas",
    iso: "bs",
    dialCode: "1242",
  },
  BH: {
    name: "Bahrain",
    iso: "bh",
    dialCode: "973",
  },
  BD: {
    name: "Bangladesh",
    iso: "bd",
    dialCode: "880",
  },
  BB: {
    name: "Barbados",
    iso: "bb",
    dialCode: "1246",
  },
  BY: {
    name: "Belarus (Беларусь)",
    iso: "by",
    dialCode: "375",
  },
  BE: {
    name: "Belgium (België)",
    iso: "be",
    dialCode: "32",
  },
  BZ: {
    name: "Belize",
    iso: "bz",
    dialCode: "501",
  },
  BJ: {
    name: "Benin (Bénin)",
    iso: "bj",
    dialCode: "229",
  },
  BM: {
    name: "Bermuda",
    iso: "bm",
    dialCode: "1441",
  },
  BT: {
    name: "Bhutan (འབྲུག)",
    iso: "bt",
    dialCode: "975",
  },
  BO: {
    name: "Bolivia",
    iso: "bo",
    dialCode: "591",
  },
  BA: {
    name: "Bosnia and Herzegovina",
    iso: "ba",
    dialCode: "387",
  },
  BW: {
    name: "Botswana",
    iso: "bw",
    dialCode: "267",
  },
  BV: {
    name: "Bouvet Island",
    iso: "bv",
    dialCode: "47",
  },
  BR: {
    name: "Brazil",
    iso: "br",
    dialCode: "55",
  },
  IO: {
    name: "British Indian Ocean Territory",
    iso: "io",
    dialCode: "246",
  },
  VG: {
    name: "British Virgin Islands",
    iso: "vg",
    dialCode: "1284",
  },
  BN: {
    name: "Brunei",
    iso: "bn",
    dialCode: "673",
  },
  BG: {
    name: "Bulgaria",
    iso: "bg",
    dialCode: "359",
  },
  BF: {
    name: "Burkina Faso",
    iso: "bf",
    dialCode: "226",
  },
  BI: {
    name: "Burundi",
    iso: "bi",
    dialCode: "257",
  },
  KH: {
    name: "Cambodia",
    iso: "kh",
    dialCode: "855",
  },
  CM: {
    name: "Cameroon",
    iso: "cm",
    dialCode: "237",
  },
  CA: {
    name: "Canada",
    iso: "ca",
    dialCode: "1",
    areaCodes: [
      "204", "236", "249", "250", "289", "306", "343", "365", "387", "403",
      "416", "418", "431", "437", "438", "450", "506", "514", "519", "548",
      "579", "581", "587", "604", "613", "639", "647", "672", "705", "709",
      "742", "778", "780", "782", "807", "819", "825", "867", "873", "902", "905"
    ],
  },
  CV: {
    name: "Cape Verde",
    iso: "cv",
    dialCode: "238",
  },
  BQ: {
    name: "Caribbean Netherlands",
    iso: "bq",
    dialCode: "599",
  },
  KY: {
    name: "Cayman Islands",
    iso: "ky",
    dialCode: "1345",
  },
  CF: {
    name: "Central African Republic",
    iso: "cf",
    dialCode: "236",
  },
  TD: {
    name: "Chad",   
    iso: "td",
    dialCode: "235",
  },
  CL: {
    name: "Chile",
    iso: "cl",
    dialCode: "56",
  },
  CN: {
    name: "China",
    iso: "cn",
    dialCode: "86",
  },
  CX: {
    name: "Christmas Island",
    iso: "cx",
    dialCode: "61",
  },
  CC: {
    name: "Cocos (Keeling) Islands",
    iso: "cc",
    dialCode: "61",
  },
  CO: {
    name: "Colombia",
    iso: "co",
    dialCode: "57",
  },
  KM: {
    name: "Comoros",
    iso: "km",
    dialCode: "269",
  },
  CD: {
    name: "Congo (DRC)",
    iso: "cd",
    dialCode: "243",
  },
  CG: {
    name: "Congo (Republic)",
    iso: "cg",
    dialCode: "242",
  },
  CK: {
    name: "Cook Islands",
    iso: "ck",
    dialCode: "682",
  },
  CR: {
    name: "Costa Rica",
    iso: "cr",
    dialCode: "506",
  },
  CI: {
    name: "Côte d'Ivoire",
    iso: "ci",
    dialCode: "225",
  },
  HR: {
    name: "Croatia",
    iso: "hr",
    dialCode: "385",
  },
  CU: {
    name: "Cuba",
    iso: "cu",
    dialCode: "53",
  },
  CW: {
    name: "Curaçao",
    iso: "cw",
    dialCode: "599",
  },
  CY: {
    name: "Cyprus (Κύπρος)",
    iso: "cy",
    dialCode: "357",
  },
  CZ: {
    name: "Czech Republic",
    iso: "cz",
    dialCode: "420",
  },
  DK: {
    name: "Denmark (Danmark)",
    iso: "dk",
    dialCode: "45",
  },
  DJ: {
    name: "Djibouti",
    iso: "dj",
    dialCode: "253",
  },
  DM: {
    name: "Dominica",
    iso: "dm",
    dialCode: "1767",
  },
  DO: {
    name: "Dominican Republic",
    iso: "do",
    dialCode: "1",
    areaCodes: ["809", "829", "849"],
  },
  EC: {
    name: "Ecuador",
    iso: "ec",
    dialCode: "593",
  },
  EG: {
    name: "Egypt",
    iso: "eg",
    dialCode: "20",
  },
  SV: {
    name: "El Salvador",
    iso: "sv",
    dialCode: "503",
  },
  GQ: {
    name: "Equatorial Guinea",
    iso: "gq",
    dialCode: "240",
  },
  ER: {
    name: "Eritrea",
    iso: "er",
    dialCode: "291",
  },
  EE: {
    name: "Estonia",
    iso: "ee",
    dialCode: "372",
  },
  ET: {
    name: "Ethiopia",
    iso: "et",
    dialCode: "251",
  },
  FK: {
    name: "Falkland Islands",
    iso: "fk",
    dialCode: "500",
  },
  FO: {
    name: "Faroe Islands",
    iso: "fo",
    dialCode: "298",
  },
  FJ: {
    name: "Fiji",
    iso: "fj",
    dialCode: "679",
  },
  FI: {
    name: "Finland (Suomi)",
    iso: "fi",
    dialCode: "358",
  },
  FR: {
    name: "France",
    iso: "fr",
    dialCode: "33",
  },
  GF: {
    name: "French Guiana",
    iso: "gf",
    dialCode: "594",
  },
  PF: {
    name: "French Polynesia",
    iso: "pf",
    dialCode: "689",
  },
  TF: {
    name: "French Southern and Antarctic Lands",
    iso: "tf",
    dialCode: "262",
  },
  GA: {
    name: "Gabon",
    iso: "ga",
    dialCode: "241",
  },
  GM: {
    name: "Gambia",
    iso: "gm",
    dialCode: "220",
  },
  GE: {
    name: "Georgia",
    iso: "ge",
    dialCode: "995",
  },
  DE: {
    name: "Germany",
    iso: "de",
    dialCode: "49",
  },
  GH: {
    name: "Ghana",
    iso: "gh",
    dialCode: "233",
  },
  GI: {
    name: "Gibraltar",
    iso: "gi",
    dialCode: "350",
  },
  GR: {
    name: "Greece",
    iso: "gr",
    dialCode: "30",
  },
  GL: {
    name: "Greenland",
    iso: "gl",
    dialCode: "299",
  },
  GD: {
    name: "Grenada",
    iso: "gd",
    dialCode: "1473",
  },
  GP: {
    name: "Guadeloupe",
    iso: "gp",
    dialCode: "590",
  },
  GU: {
    name: "Guam",
    iso: "gu",
    dialCode: "1671",
  },
  GT: {
    name: "Guatemala",
    iso: "gt",
    dialCode: "502",
  },
  GG: {
    name: "Guernsey",
    iso: "gg",
    dialCode: "44",
  },
  GN: {
    name: "Guinea (Guinée)",
    iso: "gn",
    dialCode: "224",
  },
  GW: {
    name: "Guinea-Bissau",
    iso: "gw",
    dialCode: "245",
  },
  GY: {
    name: "Guyana",
    iso: "gy",
    dialCode: "592",
  },
  HT: {
    name: "Haiti",
    iso: "ht",
    dialCode: "509",
  },
  HM: {
    name: "Heard Island and McDonald Islands",
    iso: "hm",
    dialCode: "672",
  },
  HN: {
    name: "Honduras",
    iso: "hn",
    dialCode: "504",
  },
  HK: {
    name: "Hong Kong (香港)",
    iso: "hk",
    dialCode: "852",
  },
  HU: {
    name: "Hungary",
    iso: "hu",
    dialCode: "36",
  },
  IS: {
    name: "Iceland (Ísland)",
    iso: "is",
    dialCode: "354",
  },
  IN: {
    name: "India (भारत)",
    iso: "in",
    dialCode: "91",
  },
  ID: {
    name: "Indonesia",
    iso: "id",
    dialCode: "62",
  },
  IR: {
    name: "Iran",
    iso: "ir",
    dialCode: "98",
  },
  IQ: {
    name: "Iraq",
    iso: "iq",
    dialCode: "964",
  },
  IE: {
    name: "Ireland",
    iso: "ie",
    dialCode: "353",
  },
  IM: {
    name: "Isle of Man",
    iso: "im",
    dialCode: "44",
  },
  IL: {
    name: "Israel",
    iso: "il",
    dialCode: "972",
  },
  IT: {
    name: "Italy",
    iso: "it",
    dialCode: "39",
  },
  JM: {
    name: "Jamaica",
    iso: "jm",
    dialCode: "1876",
  },
  JP: {
    name: "Japan",
    iso: "jp",
    dialCode: "81",
  },
  JE: {
    name: "Jersey",
    iso: "je",
    dialCode: "44",
  },
  JO: {
    name: "Jordan",
    iso: "jo",
    dialCode: "962",
  },
  KZ: {
    name: "Kazakhstan",
    iso: "kz",
    dialCode: "7",
  },
  KE: {
    name: "Kenya",
    iso: "ke",
    dialCode: "254",
  },
  KI: {
    name: "Kiribati",
    iso: "ki",
    dialCode: "686",
  },
  XK: {
    name: "Kosovo",
    iso: "xk",
    dialCode: "383",
  },
  KW: {
    name: "Kuwait",
    iso: "kw",
    dialCode: "965",
  },
  KG: {
    name: "Kyrgyzstan",
    iso: "kg",
    dialCode: "996",
  },
  LA: {
    name: "Laos (ລາວ)",
    iso: "la",
    dialCode: "856",
  },
  LV: {
    name: "Latvia",
    iso: "lv",
    dialCode: "371",
  },
  LB: {
    name: "Lebanon",
    iso: "lb",
    dialCode: "961",
  },
  LS: {
    name: "Lesotho",
    iso: "ls",
    dialCode: "266",
  },
  LR: {
    name: "Liberia",
    iso: "lr",
    dialCode: "231",
  },
  LY: {
    name: "Libya",
    iso: "ly",
    dialCode: "218",
  },
  LI: {
    name: "Liechtenstein",
    iso: "li",
    dialCode: "423",
  },
  LT: {
    name: "Lithuania",
    iso: "lt",
    dialCode: "370",
  },
  LU: {
    name: "Luxembourg",
    iso: "lu",
    dialCode: "352",
  },
  MO: {
    name: "Macau (澳門)",
    iso: "mo",
    dialCode: "853",
  },
  MK: {
    name: "Macedonia",
    iso: "mk",
    dialCode: "389",
  },
  MG: {
    name: "Madagascar",
    iso: "mg",
    dialCode: "261",
  },
  MW: {
    name: "Malawi",
    iso: "mw",
    dialCode: "265",
  },
  MY: {
    name: "Malaysia",
    iso: "my",
    dialCode: "60",
  },
  MV: {
    name: "Maldives",
    iso: "mv",
    dialCode: "960",
  },
  ML: {
    name: "Mali",
    iso: "ml",
    dialCode: "223",
  },
  MT: {
    name: "Malta",
    iso: "mt",
    dialCode: "356",
  },
  MH: {
    name: "Marshall Islands",
    iso: "mh",
    dialCode: "692",
  },
  MQ: {
    name: "Martinique",
    iso: "mq",
    dialCode: "596",
  },
  MR: {
    name: "Mauritania",
    iso: "mr",
    dialCode: "222",
  },
  MU: {
    name: "Mauritius",
    iso: "mu",
    dialCode: "230",
  },
  YT: {
    name: "Mayotte",
    iso: "yt",
    dialCode: "262",
  },
  MX: {
    name: "Mexico",
    iso: "mx",
    dialCode: "52",
  },
  FM: {
    name: "Micronesia",
    iso: "fm",
    dialCode: "691",
  },
  MD: {
    name: "Moldova",
    iso: "md",
    dialCode: "373",
  },
  MC: {
    name: "Monaco",
    iso: "mc",
    dialCode: "377",
  },
  MN: {
    name: "Mongolia",
    iso: "mn",
    dialCode: "976",
  },
  ME: {
    name: "Montenegro",
    iso: "me",
    dialCode: "382",
  },
  MS: {
    name: "Montserrat",
    iso: "ms",
    dialCode: "1664",
  },
  MA: {
    name: "Morocco",
    iso: "ma",
    dialCode: "212",
  },
  MZ: {
    name: "Mozambique",
    iso: "mz",
    dialCode: "258",
  },
  MM: {
    name: "Myanmar",
    iso: "mm",
    dialCode: "95",
  },
  NA: {
    name: "Namibia",
    iso: "na",
    dialCode: "264",
  },
  NR: {
    name: "Nauru",
    iso: "nr",
    dialCode: "674",
  },
  NP: {
    name: "Nepal (नेपाल)",
    iso: "np",
    dialCode: "977",
  },
  NL: {
    name: "Netherlands",
    iso: "nl",
    dialCode: "31",
  },
  NC: {
    name: "New Caledonia",
    iso: "nc",
    dialCode: "687",
  },
  NZ: {
    name: "New Zealand",
    iso: "nz",
    dialCode: "64",
  },
  NI: {
    name: "Nicaragua",
    iso: "ni",
    dialCode: "505",
  },
  NE: {
    name: "Niger",
    iso: "ne",
    dialCode: "227",
  },
  NG: {
    name: "Nigeria",
    iso: "ng",
    dialCode: "234",
  },
  NU: {
    name: "Niue",
    iso: "nu",
    dialCode: "683",
  },
  NF: {
    name: "Norfolk Island",
    iso: "nf",
    dialCode: "672",
  },
  KP: {
    name: "North Korea",
    iso: "kp",
    dialCode: "850",
  },
  MP: {
    name: "Northern Mariana Islands",
    iso: "mp",
    dialCode: "1670",
  },
  NO: {
    name: "Norway (Norge)",
    iso: "no",
    dialCode: "47",
  },
  OM: {
    name: "Oman",
    iso: "om",
    dialCode: "968",
  },
  PK: {
    name: "Pakistan",
    iso: "pk",
    dialCode: "92",
  },
  PW: {
    name: "Palau",
    iso: "pw",
    dialCode: "680",
  },
  PS: {
    name: "Palestine",
    iso: "ps",
    dialCode: "970",
  },
  PA: {
    name: "Panama",
    iso: "pa",
    dialCode: "507",
  },
  PG: {
    name: "Papua New Guinea",
    iso: "pg",
    dialCode: "675",
  },
  PY: {
    name: "Paraguay",
    iso: "py",
    dialCode: "595",
  },
  PE: {
    name: "Peru (Perú)",
    iso: "pe",
    dialCode: "51",
  },
  PH: {
    name: "Philippines",
    iso: "ph",
    dialCode: "63",
  },
  PN: {
    name: "Pitcairn Islands",
    iso: "pn",
    dialCode: "64",
  },
  PL: {
    name: "Poland (Polska)",
    iso: "pl",
    dialCode: "48",
  },
  PT: {
    name: "Portugal",
    iso: "pt",
    dialCode: "351",
  },
  PR: {
    name: "Puerto Rico",
    iso: "pr",
    dialCode: "1",
    areaCodes: ["787", "939"],
  },
  QA: {
    name: "Qatar",
    iso: "qa",
    dialCode: "974",
  },
  RE: {
    name: "Réunion",
    iso: "re",
    dialCode: "262",
  },
  RO: {
    name: "Romania",
    iso: "ro",
    dialCode: "40",
  },
  RU: {
    name: "Russia",
    iso: "ru",
    dialCode: "7",
  },
  RW: {
    name: "Rwanda",
    iso: "rw",
    dialCode: "250",
  },
  BL: {
    name: "Saint Barthélemy",
    iso: "bl",
    dialCode: "590",
  },
  SH: {
    name: "Saint Helena",
    iso: "sh",
    dialCode: "290",
  },
  KN: {
    name: "Saint Kitts and Nevis",
    iso: "kn",
    dialCode: "1869",
  },
  LC: {
    name: "Saint Lucia",
    iso: "lc",
    dialCode: "1758",
  },
  MF: {
    name: "Saint Martin (Saint-Martin (partie française))",
    iso: "mf",
    dialCode: "590",
  },
  PM: {
    name: "Saint Pierre and Miquelon (Saint-Pierre-et-Miquelon)",
    iso: "pm",
    dialCode: "508",
  },
  VC: {
    name: "Saint Vincent and the Grenadines",
    iso: "vc",
    dialCode: "1784",
  },
  WS: {
    name: "Samoa",
    iso: "ws",
    dialCode: "685",
  },
  SM: {
    name: "San Marino",
    iso: "sm",
    dialCode: "378",
  },
  ST: {
    name: "São Tomé and Príncipe (São Tomé e Príncipe)",
    iso: "st",
    dialCode: "239",
  },
  SA: {
    name: "Saudi Arabia (‫المملكة العربية السعودية‬‎)",
    iso: "sa",
    dialCode: "966",
  },
  SN: {
    name: "Senegal (Sénégal)",
    iso: "sn",
    dialCode: "221",
  },
  RS: {
    name: "Serbia (Србија)",
    iso: "rs",
    dialCode: "381",
  },
  SC: {
    name: "Seychelles",
    iso: "sc",
    dialCode: "248",
  },
  SL: {
    name: "Sierra Leone",
    iso: "sl",
    dialCode: "232",
  },
  SG: {
    name: "Singapore",
    iso: "sg",
    dialCode: "65",
  },
  SX: {
    name: "Sint Maarten",
    iso: "sx",
    dialCode: "1721",
  },
  SK: {
    name: "Slovakia (Slovensko)",
    iso: "sk",
    dialCode: "421",
  },
  SI: {
    name: "Slovenia (Slovenija)",
    iso: "si",
    dialCode: "386",
  },
  SB: {
    name: "Solomon Islands",
    iso: "sb",
    dialCode: "677",
  },
  SO: {
    name: "Somalia (Soomaaliya)",
    iso: "so",
    dialCode: "252",
  },
  ZA: {
    name: "South Africa",
    iso: "za",
    dialCode: "27",
  },
  GS: {
    name: "South Georgia and the South Sandwich Islands",
    iso: "gs",
    dialCode: "500",
  },
  KR: {
    name: "South Korea (대한민국)",
    iso: "kr",
    dialCode: "82",
  },
  SS: {
    name: "South Sudan (‫جنوب السودان‬‎)",
    iso: "ss",
    dialCode: "211",
  },
  ES: {
    name: "Spain (España)",
    iso: "es",
    dialCode: "34",
  },
  LK: {
    name: "Sri Lanka (ශ්‍රී ලංකාව)",
    iso: "lk",
    dialCode: "94",
  },
  SD: {
    name: "Sudan (‫السودان‬‎)",
    iso: "sd",
    dialCode: "249",
  },
  SR: {
    name: "Suriname",
    iso: "sr",
    dialCode: "597",
  },
  SJ: {
    name: "Svalbard and Jan Mayen",
    iso: "sj",
    dialCode: "47",
  },
  SZ: {
    name: "Swaziland",
    iso: "sz",
    dialCode: "268",
  },
  SE: {
    name: "Sweden (Sverige)",
    iso: "se",
    dialCode: "46",
  },
  CH: {
    name: "Switzerland (Schweiz)",
    iso: "ch",
    dialCode: "41",
  },
  SY: {
    name: "Syria (‫سوريا‬‎)",
    iso: "sy",
    dialCode: "963",
  },
  TW: {
    name: "Taiwan (台灣)",
    iso: "tw",
    dialCode: "886",
  },
  TJ: {
    name: "Tajikistan",
    iso: "tj",
    dialCode: "992",
  },
  TZ: {
    name: "Tanzania",
    iso: "tz",
    dialCode: "255",
  },
  TH: {
    name: "Thailand (ไทย)",
    iso: "th",
    dialCode: "66",
  },
  TL: {
    name: "Timor-Leste",
    iso: "tl",
    dialCode: "670",
  },
  TG: {
    name: "Togo",
    iso: "tg",
    dialCode: "228",
  },
  TK: {
    name: "Tokelau",
    iso: "tk",
    dialCode: "690",
  },
  TO: {
    name: "Tonga",
    iso: "to",
    dialCode: "676",
  },
  TT: {
    name: "Trinidad and Tobago",
    iso: "tt",
    dialCode: "1868",
  },
  TN: {
    name: "Tunisia (‫تونس‬‎)",
    iso: "tn",
    dialCode: "216",
  },
  TR: {
    name: "Turkey (Türkiye)",
    iso: "tr",
    dialCode: "90",
  },
  TM: {
    name: "Turkmenistan",
    iso: "tm",
    dialCode: "993",
  },
  TC: {
    name: "Turks and Caicos Islands",
    iso: "tc",
    dialCode: "1649",
  },
  TV: {
    name: "Tuvalu",
    iso: "tv",
    dialCode: "688",
  },
  GB: {
    name: "United Kingdom",
    iso: "gb",
    dialCode: "44",
  },
  US: {
    name: "United States",
    iso: "us",
    dialCode: "1",
  },
  UM: {
    name: "United States Minor Outlying Islands",
    iso: "um",
    dialCode: "1",
  },
  UY: {
    name: "Uruguay",
    iso: "uy",
    dialCode: "598",
  },
  UZ: {
    name: "Uzbekistan (Oʻzbekiston)",
    iso: "uz",
    dialCode: "998",
  },
  VU: {
    name: "Vanuatu",
    iso: "vu",
    dialCode: "678",
  },
  VA: {
    name: "Vatican City (Città del Vaticano)",
    iso: "va",
    dialCode: "39",
  },
  VE: {
    name: "Venezuela",
    iso: "ve",
    dialCode: "58",
  },
  VN: {
    name: "Vietnam (Việt Nam)",
    iso: "vn",
    dialCode: "84",
  },
  WF: {
    name: "Wallis and Futuna",
    iso: "wf",
    dialCode: "681",
  },
  EH: {
    name: "Western Sahara",
    iso: "eh",
    dialCode: "212",
  },
  YE: {
    name: "Yemen",
    iso: "ye",
    dialCode: "967",
  },
  ZM: {
    name: "Zambia",
    iso: "zm",
    dialCode: "260",
  },
  ZW: {
    name: "Zimbabwe",
    iso: "zw",
    dialCode: "263",
  },
};

export function getCountryByDialCode(dialCode: string): WorldCountry | undefined {
  return Object.values(WORLD_COUNTRIES).find(country => country.dialCode === dialCode);
}

export function getCountryByISO(iso: string): WorldCountry | undefined {
  const upperISO = iso.toUpperCase();
  return WORLD_COUNTRIES[upperISO];
}
  
  ​