(function($) {
  var namespace = "http://www.w3.org/2000/svg";
  
  var tags = ['a', 'altGlyph', 'altGlyphDef', 'altGlyphItem', 'animate', 'animateColor', 'animateMotion', 'animateTransform', 
 'circle', 'clipPath', 'color-profile', 'cursor', 'defs', 'desc', 'ellipse', 'feBlend', 'feColorMatrix', 
 'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight', 
 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode', 
 'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence', 'filter', 
 'font', 'font-face', 'font-face-format', 'font-face-name', 'font-face-src', 'font-face-uri', 'foreignObject', 'g', 
 'glyph', 'glyphRef', 'hkern', 'image', 'line', 'linearGradient', 'marker', 'mask', 'metadata', 'missing-glyph', 'mpath', 
 'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect', 'script', 'set', 'stop', 'style', 'svg', 'switch', 
 'symbol', 'text', 'textPath', 'title', 'tref', 'tspan', 'use', 'view', 'vkern'];
 
 var lowerTags = [];
 $(tags).each(function(){
    lowerTags.push(this.toLowerCase());
 });
  
 
 window.$s = $.svg = function(selector, context) {
   context = context || document;
   if (typeof selector === "string" && selector.charAt(0) === "<" && selector.charAt( selector.length - 1 ) === ">" && selector.length >= 3) {
     var singleTag = /^<(\w+)\s*(\/>|><\/\1>)$/;
     var match = singleTag.exec(selector);
     if(match && lowerTags.indexOf(match[1].toLowerCase()) != -1) {
       selector = context.createElementNS(namespace, match[1]);
     } else {
       var fakeDiv = $('<div></div>').html(selector);
       var createChild=function(elem) {
	 var ret = [];
	 if(elem.childNodes) {
	  for(var i = 0; i < elem.childNodes.length; i++) {
	    if(elem.childNodes[i].nodeType == 3) {
	      ret.push(elem.childNodes[i]);
	    } else {
	      var children = createChild(elem.childNodes[i]);
	      var attrs = {};
	      $.each(elem.childNodes[i].attributes, function(i, e){attrs[e.nodeName] = e.nodeValue});
	      var index = lowerTags.indexOf(elem.childNodes[i].tagName.toLowerCase());
	      if(index != -1) {
		var e = context.createElementNS(namespace, tags[index]);
		for(var j in attrs) {
		  e.setAttribute(j, attrs[j]);
		}
	      } else {
		var e = context.createElement(elem.childNodes[i].tagName);
		for(var j in attrs) {
		  $(e).attr(j, attrs[j]);
		}
	      }
	      
	      for(var k = 0; k < children.length; k++) {
		e.appendChild(children[k]);
	      }
	      ret.push(e);
	    }
	  }
	 }
	 return ret;
       }
       selector = createChild(fakeDiv[0]);
     }
   } 
   return $(selector, context);
 };
 
 if(!$.cssHooks) {
   throw("jQuery 1.4.3+ is needed for this plugin to work");
   return;
 }
 
 var atts = ['cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2'];
 for(var i in atts) {
   (function(att) {
    $.cssHooks[att] = {
      get: function(elem, computed, extra) {
	return $(elem).attr(att);
      }, 
      set: function(elem, value) {
	$(elem).attr(att, value);
      }
    };
    
    $.Tween.propHooks[att] = {
      get: function(tween) {
	return $(tween.elem).attr(tween.prop);
      }, 
      set: function(tween) {
	$(tween.elem).attr(tween.prop, tween.now);
      }
    };
    
    $.cssNumber[att] = true;
    
    $.fx.step[att] = function(fx) {
      $.cssHooks[att].set(fx.elem, fx.now);
    };
   })(atts[i]);
 }
 
 var defaults = {
   draggable: false
 };
 
 var methods = {
    init: function(options) {
      return this.each(function(){
	var $t = $(this);
	if(tags.indexOf(this.tagName) != -1) {
	  if(!$t.data('svg')) {
	    $t.data('svg', {});
	    if(this.tagName == 'svg') {
	      $t.data('svg').vp = $t;
	    } else {
	      $t.data('svg').vp = $($t.prop('viewportElement'));
	    }
	  }
	  var params = $.extend({}, defaults, options);
	  for(var i in params) {
	    methods.option.call($t, i, params[i]);
	  }
	}
      });
    },
    option: function(option, value) {
      if($.type(value) == 'undefined') {
	return this.data('svg')[option];
      } else {
	return this.each(function(){
	  var $t = $(this);
	  $t.data('svg')[option] = value;
	  switch(option) {
	    case 'draggable':
	      if($t.data('svg').vp.length) {
		$t.mousedown(function(evt){		
		  if($t.data('svg').draggable) {
		    $t.data('svg').dragging = true;
		    $t.data('svg').dragX = evt.clientX;
		    $t.data('svg').dragY = evt.clientY;
		    $t.data('svg').preZIndex = $t.css('zIndex');
		    $t[0].style.zIndex= "3000";
		    $t.trigger({
		      type: "dragstart",
		      clientX: evt.clientX,
		      clientY: evt.clientY
		    });
		    $t.data('svg').vp.on('mousemove.svg', function(evt) {
		      var diffX = evt.clientX - $t.data('svg').dragX;
		      var diffY = evt.clientY - $t.data('svg').dragY;
		      var xatts = ['cx', 'x', 'x1', 'x2'];
		      for(var x in xatts) {
			if($t.attr(xatts[x])) {
			  $t.css(xatts[x], parseInt($t.css(xatts[x])) + diffX);
			}
		      }
		      var yatts = ['cy', 'y', 'y1', 'y2'];
		      for(var y in yatts) {
			if($t.attr(yatts[y])) {
			  $t.css(yatts[y], parseInt($t.css(yatts[y])) + diffY);
			}
		      }
		      $t.data('svg').dragX = evt.clientX;
		      $t.data('svg').dragY = evt.clientY;
		      $t.trigger({
			type: "drag",
			clientX: evt.clientX,
			clientY: evt.clientY
		      });
		    });
		  }
		});
		$t.data('svg').vp.mouseup(function(evt){
		  if($t.data('svg').dragging) {
		    $t.data('svg').dragging = false;
		    $t.data('svg').vp.off('mousemove.svg');
		    $t[0].style.zIndex= $t.data('svg').preZIndex;
		    $t.trigger({
		      type: "dragend",
		      clientX: evt.clientX,
		      clientY: evt.clientY
		    });
		  }
		});
		$t.data('svg').vp.mouseout(function(evt){
		  if($t.data('svg').dragging && (evt.offsetX < 0 || evt.offsetY < 0 || evt.offsetX > this.clientWidth || evt.offsetY > this.clientHeight)) {
		    $t.data('svg').dragging = false;
		    $t.data('svg').vp.off('mousemove.svg');
		    $t[0].style.zIndex= $t.data('svg').preZIndex;
		    $t.trigger({
		      type: "dragend",
		      clientX: evt.clientX,
		      clientY: evt.clientY
		    });
		  }
		});
	      }
	      break;
	  }
	});
      }
    }
  };
  
  
  $.fn.svg = function(method) {
    // Method calling logic
    if ( methods[method] ) {
      return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.svg' );
    }    
  
  };
})(jQuery);