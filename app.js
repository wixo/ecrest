var express = require( 'express' )
  , cheerio = require( 'cheerio' )
  , request = require( 'request' )
  , url     = require( 'url' )
  , app     = express( )
  , http    = require( 'http' )
  , path    = require( 'path' )
  ;

app.configure( function () {
	app.set('port', process.env.PORT || 2013);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));
} );

app.configure('development', function(){
	app.use(express.errorHandler());
});

// News
app.get( '/' , function (req, res) {
	request( { uri: 'http://elcomercio.pe' }, function (err, response, body) {
		var self = this
		  , i
		  ;

		self.items = [];

		if (err && response.statusCode !== 200) {
			console.log('Request error.');
		}

		var $     = cheerio.load(body)
		  , $news = $('.wmedia')
		  ;

		$news.eq(0).children().each( function (i, item) {
			var $item  = $(item)
			  , $a     = $item.find('h2 > a')
			  , $title = $item.find('h2 > a').text()
			  , $text  = $item.find('p.intro').text()
			  , $img   = $item.find('.media-type > a > img')
			  ;

			if ( i > 0 ) {
				self.items[i] = { href : $a.attr('href') && url.parse( $a.attr('href'), true ).pathname
				                , title: $title
				                , text : $text
				                , img  : $img.attr('src') || (self.items[i-1] && self.items[i-1].img)
				                };
			}

		} );

		i = self.items.length;
		while (i--) {
			self.items[i] && self.items[i].title === '' && delete self.items[i]
		}

		res.json('news', self.items.filter( function (n) { return n; } ) );

	} );
} );

// Story
app.get( '/:cat/:id/:slug' , function (req, res){
	var pathname = url.parse(req.url,true).pathname;

	request({ uri: 'http://elcomercio.pe/' + pathname }, function (err, response, body) {
		var self       = this
		  , $          = cheerio.load(body)
		  , $story     = $('#news')
		  , $mainImg   = $story.find('.cnt-player > img').eq(0).attr('src') || 'http://cde.elcomercio.e3.pe/66/ima/0/0/6/1/4/614643.jpg'
		  , $storyText = $story.find('#textonota').html()
		  ;

		$mainImg = $mainImg.replace('thumb/','')

		self.story = { mainImg   : $mainImg
		             , storyText : $storyText
		             }

		res.json('story', self.story);

	} );

});

http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});
