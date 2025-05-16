// metroToNpaMap.ts

export interface MetroAreaInfo {
    population: number;
    areaCodes: string[];
  }
  
  export const metroToNpaMap: Record<string, MetroAreaInfo> = {
    "new-york-ny": {
      population: 19154000,
      areaCodes: ["212", "718", "917", "646", "332", "201", "551"]
    },
    "los-angeles-ca": {
      population: 12678000,
      areaCodes: ["213", "310", "323", "424", "562", "626", "657", "714", "818", "909"]
    },
    "chicago-il": {
      population: 9279427,
      areaCodes: ["312", "773", "708", "847", "630", "224"]
    },
    "dallas-tx": {
      population: 8304439,
      areaCodes: ["214", "469", "972", "817", "682"]
    },
    "houston-tx": {
      population: 7206841,
      areaCodes: ["713", "281", "832", "346"]
    },
    "washington-dc": {
      population: 6385162,
      areaCodes: ["202", "703", "571", "301", "240"]
    },
    "miami-fl": {
      population: 6167000,
      areaCodes: ["305", "786", "954", "754"]
    },
    "philadelphia-pa": {
      population: 6102434,
      areaCodes: ["215", "267", "445", "856", "302"]
    },
    "atlanta-ga": {
      population: 5949951,
      areaCodes: ["404", "470", "678", "770"]
    },
    "phoenix-az": {
      population: 5059909,
      areaCodes: ["602", "480", "623", "928"]
    },
    "boston-ma": {
      population: 4899932,
      areaCodes: ["617", "857", "781", "339", "978"]
    },
    "san-francisco-ca": {
      population: 4749008,
      areaCodes: ["415", "628", "510", "341", "925"]
    },
    "riverside-ca": {
      population: 4653105,
      areaCodes: ["909", "951", "760"]
    },
    "detroit-mi": {
      population: 4392041,
      areaCodes: ["313", "248", "586", "734"]
    },
    "seattle-wa": {
      population: 4102400,
      areaCodes: ["206", "425", "253"]
    },
    "minneapolis-mn": {
      population: 3738000,
      areaCodes: ["612", "651", "763", "952"]
    },
    "san-diego-ca": {
      population: 3286069,
      areaCodes: ["619", "858"]
    },
    "tampa-fl": {
      population: 3219514,
      areaCodes: ["813", "727", "941"]
    },
    "denver-co": {
      population: 3151000,
      areaCodes: ["303", "720", "970"]
    },
    "baltimore-md": {
      population: 2985000,
      areaCodes: ["410", "443", "667"]
    },
    "st-louis-mo": {
      population: 2820253,
      areaCodes: ["314", "636", "618"]
    },
    "charlotte-nc": {
      population: 2754000,
      areaCodes: ["704", "980"]
    },
    "orlando-fl": {
      population: 2691000,
      areaCodes: ["407", "321", "689"]
    },
    "san-antonio-tx": {
      population: 2681000,
      areaCodes: ["210", "726"]
    },
    "portland-or": {
      population: 2653000,
      areaCodes: ["503", "971"]
    },
    "sacramento-ca": {
      population: 2559000,
      areaCodes: ["916", "279"]
    },
    "pittsburgh-pa": {
      population: 2429000,
      areaCodes: ["412", "724"]
    },
    "las-vegas-nv": {
      population: 2325000,
      areaCodes: ["702", "725"]
    },
    "cincinnati-oh": {
      population: 2256000,
      areaCodes: ["513", "283"]
    },
    "kansas-city-mo": {
      population: 2199000,
      areaCodes: ["816", "913"]
    },
    "columbus-oh": {
      population: 2138000,
      areaCodes: ["614", "380"]
    },
    "indianapolis-in": {
      population: 2111000,
      areaCodes: ["317", "463"]
    },
    "cleveland-oh": {
      population: 2088000,
      areaCodes: ["216", "440", "234"]
    },
    "san-jose-ca": {
      population: 2000000,
      areaCodes: ["408", "669"]
    },
    "nashville-tn": {
      population: 1989000,
      areaCodes: ["615", "629"]
    },
    "virginia-beach-va": {
      population: 1799000,
      areaCodes: ["757", "948"]
    },
    "providence-ri": {
      population: 1676000,
      areaCodes: ["401"]
    },
    "milwaukee-wi": {
      population: 1575000,
      areaCodes: ["414", "262"]
    },
    "jacksonville-fl": {
      population: 1559000,
      areaCodes: ["904"]
    },
    "oklahoma-city-ok": {
      population: 1441000,
      areaCodes: ["405", "572"]
    },
    "raleigh-nc": {
      population: 1432000,
      areaCodes: ["919", "984"]
    },
    "memphis-tn": {
      population: 1344000,
      areaCodes: ["901"]
    },
    "richmond-va": {
      population: 1321000,
      areaCodes: ["804"]
    },
    "louisville-ky": {
      population: 1308000,
      areaCodes: ["502"]
    },
    "new-orleans-la": {
      population: 1270000,
      areaCodes: ["504"]
    },
    "hartford-ct": {
      population: 1206000,
      areaCodes: ["860", "959"]
    },
    "buffalo-ny": {
      population: 1156000,
      areaCodes: ["716"]
    },
    "salt-lake-city-ut": {
      population: 1153000,
      areaCodes: ["801", "385"]
    },
    "rochester-ny": {
      population: 1090000,
      areaCodes: ["585"]
    },
    "grand-rapids-mi": {
      population: 1086000,
      areaCodes: ["616"]
    }
  };
  