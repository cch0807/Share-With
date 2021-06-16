const mapOptions = {
    center: new naver.maps.LatLng(37.529719, 126.964631),
    zoom: 8
};

const map = new naver.maps.Map('map', mapOptions);

$.ajax({
    url: "/location",
    type: "GET"
}).done((response) => {
    if (response.message !== "success") return;
    const data = response.data;
    
let markerList = [];
let infowindowList =[];

const getClickHandler = (i) => () => {
    const marker = markerList[i];
    const infowindow = infowindowList[i];
    if (infowindow.getMap()) {
        infowindow.close();
    }else{
        infowindow.open(map, marker);
    }
};

const getClickMap = (i) => () => {
    const infowindow = infowindowList[i];
    infowindow.close();
};

for(let i in data) {
    const target = data[i];
    const lating = new naver.maps.LatLng(target.lat, target.lng);

    let marker = new naver.maps.Marker({
        map: map,
        position: lating,
        icon : {
            content: `<div class="marker"></div>`,
            anchor: new naver.maps.Point(7.5, 7.5),
        },
    });

    const content = `
    <div class="infowindow_wrap" style="text-align: center;">
    <hr>
      <div class="infowindow_title">${target.title}</div>
      <div class="infowindow_address">${target.address}</div>
      <hr>
      <div class="infowindow_write">${target.write}</div>
      
    </div>
    `;
    let listEl = document.getElementById("placesList");
    const el = document.createElement("div");
        const itemStr=`
         <div class="info">
           <div class="info"></div>
           <div class="info_title">
           ${target.title}
           </div>
           <span>${target.address}</span>
         </div>
        `;
        el.innerHTML = itemStr;
        el.className = "item";
        listEl.appendChild(el);

    const infowindow = new naver.maps.InfoWindow({
        content : content,
        backgroundColor: "#00ff0000",
        borderColor: "#00ff0000",
        anchorSize: new naver.maps.Size(0, 0),
    });

    markerList.push(marker);
    infowindowList.push(infowindow);
}

for (let i = 0, ii = markerList.length; i < ii; i++) {
    naver.maps.Event.addListener(markerList[i],"click",getClickHandler(i));
    naver.maps.Event.addListener(map,"click",getClickMap(i));
} 

const cluster1 = {
    content: `<div class="cluster1"></div>`,
};

const cluster2 ={
    content: `<div class="cluster2"></div>`,
};

const cluster3 = {
    content: `<div class ="cluster3"></div>`,
}
const markerClustering = new MarkerClustering({
    minClusterSize: 2,
    maxZoom: 12,
    map : map,
    markers: markerList,
    disableClickZoom: false,
    gridSize: 20,
    icons: [cluster1, cluster2, cluster3],
    indexGernerator: [2,5,10],
    stylingFunction: (clusterMarker, count) => {
        $(clusterMarker.getElement()).find("div:first-child").text(count);
    },
});
});

const urlPrefix = "https://navermaps.github.io/maps.js/docs/data/region";
const urlSuffix =".json";

let regionGeoJson =[];
let loadCount = 0;

const tooltip = $(
    `<div style="position:absolute;z-index:1000;padding:5px 10px;background:white;border:1px solid black;font-size:14px;display:none;pointer-events:none;"></div>`  );
tooltip.appendTo(map.getPanes().floatPane);
naver.maps.Event.once(map, "init_stylemap", () => {
    for (let i =1; i< 18; i++) {
        let keyword = i.toString();
        if(keyword.length === 1) {
            keyword = "0" + keyword;
        }
        $.ajax({
            url:urlPrefix + keyword + urlSuffix,
        }).done((geojson) => {
            regionGeoJson.push(geojson);
            loadCount++;
            if (loadCount === 17) {
                startDataLayer();
            }
        });
    }
});

function startDataLayer() {
    map.data.setStyle((feature) => {
        const styleOptions ={
            fillColor: "#ff0000",
            fillOpacity: 0.0001,
            strokeColor: "#ff0000",
            strokeWeight: 2,
            strokeOpacity: 0.4,
        };

        if(feature.getProperty("focus")) {
            styleOptions.fillOpacity = 0.6;
            styleOptions.fillColor = "#0f0";
            styleOptions.strokeColor= "#0f0";
            styleOptions.strokeWeight = 4;
            styleOptions.strokeOpacity = 1;
        }
        return styleOptions;
    });

    regionGeoJson.forEach((geojson) => {
        map.data.addGeoJson(geojson);
    });

    map.data.addListener("click", (e) => {
        let feature = e.feature;
        if(feature.getProperty("focus")!== true){
            feature.setProperty("focus", true);
        } else {
            feature.setProperty("focus", false);
        }
    });

    map.data.addListener("mouseover", (e) => {
        let feature = e.feature;
        let regionName = feature.getProperty("area1");
        tooltip.css({
            display: "block",
            left: e.offset.x,
            top: e.offset.y,
        })
        .text(regionName);
    map.data.overrideStyle(feature, {
        fillOpacity: 0.6,
        strokeWeight: 4,
        strokeOpacity: 1,
    });
    
    });
    map.data.addListener("mouseout",(e) => {
        tooltip.hide().empty();
        map.data.revertStyle();
    })
}