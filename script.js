var x=0;
var y=0;

var imgW = 100;
var imgH = 200;

var tile_column = 0;
var tile_row = 0;

var max_width = 240;
var pdfX = 0;
new DroneDeploy({version: 1}).then(function(api) {
    console.log('DroneDeploy Api: ', api);
	
	var corslink = [];
    var image = new Image();
    api.Plans.getCurrentlyViewed().subscribe(function(plan) {
	    api.Images.get(plan.id).subscribe(function(images) {})
        api.Tiles.get({planId: plan.id, layerName: 'ortho', zoom: 20})
        .then(function (res) {
            const tiles = getTilesFromGeometry(plan.geometry, res.template, 20);
            for(i = 0; i < tiles.length; i++) {
                  corslink[i] = `https://cors.now.sh/` + tiles[i];      //cors enable header
	        }
            console.log("Click button to print");

            document.getElementById("demo").onclick = function() { 
                build_canvas(corslink);
            };

                  
      	})
  	});

});

function build_canvas (safelink) {
    console.log("Printing");
    var canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d');
    canvas.style.display="none";
    canvas.width = 1000;
    canvas.height = 2000;
    context.clearRect( 0 , 0 , canvas.width, canvas.height );  //Set the background white
    context.fillStyle="#FFFFFF";                               //
    context.fillRect(0 , 0 , canvas.width, canvas.height);     //
    
    var doc = new jsPDF();

    var loaders = [];
    for (var i = 0; i < safelink.length; i++) {
        loaders.push(loadSprite(safelink[i], canvas, context, i));     
    }
    $.when.apply(null, loaders).done(function() { 
        doc.addImage(canvas, 'JPEG', pdfX, 0, 210, 200);
        doc.save("map.pdf");
        console.log("Printed!");
    });       
}

function loadSprite(src, canvas, context, index) {

    var deferred = $.Deferred();        //Deferred the pdf-generation to wait for complete loading of images
    var sprite = new Image();
    sprite.setAttribute('crossOrigin', 'anonymous');        //Allow Cross-origin resource sharing
    sprite.src = src;
    sprite.onload = function() {
 
        var scaleX = index % tile_column;
        x = imgW * scaleX;
     
        var scaleY = parseInt(index / tile_column);
        y = imgH*scaleY;
        
        context.drawImage(sprite, x , y, imgW, imgH); 
        deferred.resolve();
    };  
    return deferred.promise();
}

function getTilesFromGeometry(geometry, template, zoom) {
    function long2tile(lon, zoom) {
        return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
    }
    function lat2tile(lat, zoom) {
        return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
    }
    function replaceInTemplate(point) {           
        return template.replace('{z}', point.z)
          .replace('{x}', point.x)
          .replace('{y}', point.y);
    }

    var allLat = geometry.map(function (point) {
        return point.lat;
    });
    var allLng = geometry.map(function (point) {
        return point.lng;
    });
    var minLat = Math.min.apply(null, allLat);
    var maxLat = Math.max.apply(null, allLat);

    var minLng = Math.min.apply(null, allLng);
    var maxLng = Math.max.apply(null, allLng);
    var top_tile = lat2tile(maxLat, zoom); // eg.lat2tile(34.422, 9);
    var left_tile = long2tile(minLng, zoom);
    var bottom_tile = lat2tile(minLat, zoom);
    var right_tile = long2tile(maxLng, zoom);
        
    tile_row = top_tile - bottom_tile + 1;
    tile_column = right_tile - left_tile + 1;
    pdfX = (max_width - (tile_column*20))/2 -20;

    var tiles = [];
    for (var y = top_tile; y < bottom_tile + 1; y++) {
        for (var x = left_tile; x < right_tile + 1; x++) {
            tiles.push(replaceInTemplate({ x, y, z: zoom }))
        }
    }
    return tiles;
}