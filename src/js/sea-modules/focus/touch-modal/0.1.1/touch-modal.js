define("focus/touch-modal/0.1.1/touch-modal",["underscore","$","events"],function(a){var d=a("underscore"),e=a("$"),f=a("events"),g=function(a,b){d.bindAll(this),this.$el=e(a),this.options=b||{},this.$mask=e("<div></div>"),this.$mask.appendTo(e("body")).hide(),this.$el.on("click",'[data-action="hideModal"]',this.hide),this.$mask.tap(this.hide),e(window).resize(this.setStyle)};return g.prototype={constructor:g,show:function(){this.setStyle(),this.showMask(),this.$el.fadeIn(300)},showPeriod:function(a){this.show(),this.hideTimer=setTimeout(d.bind(this.hide,this),a)},hide:function(){clearTimeout(this.hideTimer),this.$el.fadeOut(300,this.hideMask),this.trigger("hide")},showMask:function(){this.$mask.fadeIn(),this.isShow=!0},hideMask:function(){this.$mask.hide(),this.$el.css("top","-5000px"),this.isShow=!1},setStyle:function(a){if(!a||this.isShow){this.$el.css({"z-index":9990,position:"absolute",top:"-5000px",display:"block"});var b=(e(window).height()-this.$el.offset().height)/2+(window.scrollTop||window.scrollY),c=(e(window).width()-this.$el.offset().width)/2+(window.scrollLeft||window.scrollX);this.$el.css({top:b>0?b:0,left:c>0?c:0,"z-index":9990,position:"absolute"});var d=Math.max(document.documentElement.scrollWidth,document.documentElement.offsetWidth,document.body.scrollWidth),f=Math.max(document.documentElement.scrollHeight,document.documentElement.offsetHeight,document.body.scrollHeight);this.$mask.css({position:"absolute",background:"black","z-index":9980,width:d+"px",height:f+"px",top:0,left:0,margin:0,padding:0,opacity:.15})}},$:function(a){return this.$el.find(a)}},f.mixTo(g),g});