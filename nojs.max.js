/*
 * nojs	
 * 2012-11-26
 * nolure@vip.qq.com
 */
(function( window, undefined ){
	var document = window.document,
		navigator = window.navigator,
		/*
		 *	#string选择器匹配正则 (支持tag通配符*) 5种模式+创建元素
		 * 
		 *	match[1] $('#id')
		 *  match[2] $('div')
		 * 	match[3] $('.class') (包括'div.class')
		 * 	match[4] $('div[attr=value]') 属性选择 (包括'div[attr]'表示含有attr属性的)
		 * 	match[5] $('#id .class>div')多级查找、$('#id .class,.class,div ul')混合查找
		 * 
		 * 	match[6] $('<div>create element</div>')
		 * 
		 * 	#直接包装dom对象或集合
		 * 	$(document)
		 * 	$(window)
		 * 
		 */
		rquickreg = /^(?:#([\w\-]+)|([\w\*]+)|([\w\*]*\.[\w\-]+)|([\w\*]*\[[\w\W]+\])|([^<>][\w#\*\.,\-\s>\[\]="']+[^<>#\.,])|[^#<]*(<[\w\W]+>)[^>]*)$/,
		_root,
		
		arr_push = Array.prototype.push,
		arr_slice = Array.prototype.slice,
		str_trim = String.prototype.trim,
		
		//selectorCache = {},
		$ = function( selector ){
			return new $.init( selector );
		}
	
	$.init = function( selector ){
		/*
		 *
		 */
		
		var match, elem, wrap;
		if( !selector ){
			return;
		}
		if( typeof selector === 'string' ){
			selector = $.trim( selector );
			if(!selector){
				return;
			}
			match = rquickreg.exec( selector );			
			
			if( match ){
				if(match[1]){
					//$('#id') 直接匹配id
					elem = document.getElementById(match[1]);
					if(elem){
						arr_push.call( this, elem );
						this.selector = selector;
					}
					return;
				}else if(match[6]){
					//$('<div>') 动态创建元素
					wrap = document.createElement('div');
					wrap.innerHTML = selector;
					arr_push.apply( this, wrap.childNodes );
					wrap = null;
					return;
				}
			}
			
			return _root.find( selector, match );
		}else if( selector.nodeType || selector === window ){
			//单个DOM element || window
			arr_push.call( this, selector );
		}else if( selector.length && selector[0].nodeType ){
			//元素集合
			arr_push.apply( this, selector );
		}
	}
	$.fn = $.init.prototype = $.prototype = {
		constructor : $,
		length : 0,
		selector : '',		
		splice : [].splice,
		
		find : function( selector, match ){
			/*
			 * 在当前范围内查找所有下级dom
			 * @selector:string
			 * @match:匹配规则结果，只从构造函数传入
			 */
			var length = this.length,
				mark, elements = [], html,
				i, j, k, m, tag = [], _tag, Class, _class, reg,
				ret = $();
			
			if( typeof selector != 'string' ){
				return ret;
			}	
			selector = $.trim(selector);
			
			//上级为空，无需查找，直接返回	
			if( !length || !selector ){
				return ret;
			}
			
			match = match || rquickreg.exec( selector );
			if( match ){
				if( match[2] || match[3] || match[4] || (document.querySelectorAll&&match[5]) ){
					// $('tag') || $('tag.class') || $('tag[name=user]') || $('div li')
					_tag = selector;
					if( match[3] ){
						Class = selector.split('.');
						_tag = Class[0] || '*';
					}else if( match[4] ){
						Class = selector.replace(/\]$/,'').split('[');
						_tag = Class[0] || '*';
					}
					
					this.each(function( index ){
						if(!this.nodeType){return;}
						if( document.querySelectorAll ){
							m = this.querySelectorAll( selector );
						}else if( document.getElementsByClassName && match[3] ){
							m = this.getElementsByClassName( Class[1] );
						}else {
							m = this.getElementsByTagName( _tag );
						}
						arr_push.apply( tag, m );
					})
					
					//没有找到元素
					if( !tag.length ){
						return ret;
					}
					elements = match[2] && length==1 ? tag : Selector( tag, 'find', selector );
				}else if( match[5] ){
					//$('#id .class > div,div ul > a')
					if( !/[\s>,]/g.test( selector ) ){//必须为多级查找或并列查找
						return ret;
					}
					selector = selector.replace(/\s+/g,' ').replace(/[\s]*(>|,)[\s]*/g,'$1').split(',');//去除多余空格
					
					//selector = selector.split(',');
					for( i=0; i<selector.length; i++ ){
						m = selector[i].split(' ');
						mark =  null;
						for( j=0; j<m.length; j++ ){
							_tag = m[j];
							if( _tag.indexOf('>') == -1 ){//find
								mark = ( mark || this ).find( _tag );
							}else{//children
								_tag = _tag.split('>');
								mark = this.find( _tag[0] );
								if( !mark.length ){
									break;
								}
								for( k=1; k<_tag.length; k++ ){
									if( _tag[k] ){
										mark = mark.children( _tag[k] );
									}
								}
							}
							if( !mark.length ){
								break;
							}
						}
						arr_push.apply( elements, arr_slice.call(mark) );
					}
				}else if( match[1] ){
					//$('#id')
					elements.push( document.getElementById( match[1] ) );
				}
			}
			
			return this.addBranch( elements, 'find', selector );
		},
		
		addBranch : function( elements, type, selector ){
			/*
			 * 在当前对象上创建一个新的分支
			 * @elements : Array元素集合
			 * @type : 操作类别slice
			 * @selector : 选择器string|fn
			 */
			var ret = $(),
				_type = $.type( selector );
			arr_push.apply( ret, elements || [] );
			//ret.context = elements;//保存查找范围
			ret.prevObject = this;//保存上级查找对象
			
			selector = _type=='string' ? selector : (_type=='function' ? selector.toString() : '');
			
			if( selector && type ){
				if( type == 'find' ){
					ret.selector = this.selector + ( this.selector ? ' ' : '' ) + selector;
				}else{
					ret.selector = this.selector + "." + type + "(" + selector + ")";
				}
			}
			
			return ret;
		},
		
		eq : function( i ){
			//选取集合中某个dom
			return i === -1 ?
				this.slice( i ) :
				this.slice( i, ++i );
		},
		
		first : function(){
			return this.slice( 0, 1 );
		},
		
		last : function(){
			return this.slice( -1 );
		},
		
		slice : function(){
			//选取集合中某个区段dom
			return this.addBranch( arr_slice.apply( this, arguments ), 'slice', arr_slice.call(arguments).join(",") );
		},
		
		end: function() {
			//返回上级操作
			return this.prevObject || $();
		},
		
		hasClass : function( name ){
			var has = false;
			this.each(function(){
				if( $.hasClass( this, name ) ){
					has = true;
					return false;
				}
			})
			return has;
		},
		
		each : function( fn ){
			return $.each( this, fn );
		},
		
		filter : function( selector ){
			/*
			 * 筛选出符合指定表达式的元素集合
			 * @selector : 选择器string|fn
			 */
			var elems = arr_slice.call( this );
			elems = Selector( elems, 'filter', selector );
			return this.addBranch( elems, 'filter', selector );
		},
		
		not : function( selector ){
			//与filter相反
			var elems = arr_slice.call( this ),
				newElems = [];
			this.each(function(){
				if( !Selector( [this], 'not', selector ).length ){
					newElems.push( this );
				}
			});
			return this.addBranch( newElems, 'not', selector );
		},
		
		is : function( selector ){
			var s = false;
			this.each(function(){
				if( $.is( this, selector ) ){
					s = true;
					return false;
				}
			})
			return s;
		},
		
		index : function(){
			/*
			 * 获取元素索引值，有多个元素时取第一个的index,为空时返回-1
			 */
			if( !this.length ){
				return -1;
			}
			
			var index = 0,
				elem = this[0],
				siblings = $.siblings( elem ),
				len = siblings.length,
				next = $.next( elem ),
				i = 0, node;
				
			if(!len){
				return index;
			}
			if(!next.length){
				return len;
			}
			next = next[0];
			for( ; i<len; i++ ){
				node = siblings[i];
				if( node===next ){
					index = i;
					break;
				}
			}
			return index;
		}
	}
	
	//保存所有配置常量
	$.config = {};
	
	function Selector( elements, type, selector ){
		/*
		 * 在已知elements元素集合Array中筛选出符合表达式的集合
		 * @selector:string|fn
		 */
		var elems = [],
			i, j, Class, _tag, mark, m, reg, tagName;
			
		selector = selector || '*';
		
		if( typeof selector == 'string' ){
			mark = 'getAlready';
			match = rquickreg.exec( selector );
			
			if( !match ){
				return elems;
			}
			
			if( type === 'find' && document.querySelectorAll ){
				//标准浏览器中通过querySelectorAll取出的元素，只需过滤重复元素即可
				//find方法中match[5]只会出现在这里
				$.each( elements, function(){
					if( !this[mark] ){
						elems.push( this );
						this[mark] = true;
					}
				})
				clear();
				return elems;
			}
			
			if( match[2] || match[3] || match[4] ){
				// tag || *.class || *[attr=val]
				Class = selector.split('.');
				_tag = selector;
				
				if( match[3] ){
					Class = selector.split('.');
					_tag = Class[0] || '*';
				}else if( match[4] ){
					Class = selector.replace(/\]$/,'').split('[');
					_tag = Class[0] || '*';
					Class = Class[1].split('=');
					//console.log(selector);
					Class[1] = Class[1] || '';
					Class[1] = Class[1].replace(/^["']/,'').replace(/["']$/,'');//替换属性2端的引号
				}
				
				$.each( elements, function(){
					if( this[mark] || this.nodeType!==1 ){//过滤已标记dom
						return;
					}
					this[mark] = true;
					
					tagName = _tag==='*' ? '*' : this.tagName.toLowerCase();
					if( _tag!==tagName ){
						return;
					}
					
					if( match[2] ){
						elems.push( this );
					}else if( match[3] ){
						//find方法中取出的元素是通过getElementsByClassName方法取得的(标准浏览器),过滤即可
						//其他检测其classname
						if( (type == 'find' && this.getElementsByClassName) || $.hasClass( this, Class[1] ) ){
							elems.push( this );
						}
					}else if( match[4] ){
						m = $.attr( this, Class[0] );
						if( (m === Class[1]) || (!Class[1] && m!==null) ){
							elems.push( this );
						}
					}
				})
				clear();
				
			}else if( match[1] ){
				//id
				$.each( elements, function(){
					if( this.id === match[1] ){
						elems.push( this );
						return false;
					}
				})
			}else if( match[5] && type != 'find' ){
				//并列查找
				selector = selector.replace(/\s+/g,' ').replace(/[\s]*(,)[\s]*/g,'$1');//去除多余空格
				if( /[\s>]/.test( selector ) ){//除去多级查找
					return elems;
				}
				
				if( /\,/.test( selector ) ){//并列
					selector = selector.split(',');
					for( i=0; i<selector.length; i++ ){
						m = selector[i];
						arr_push.apply( elems, Selector( elements, type, m ) );
					}
				}
			}
		}else if( $.type(selector) == 'function' ){
			$.each( elements, function(){
				if( selector.call( this ) ){
					elems.push( this );
				}
			})
		}
		function clear(){
			//清除标记
			$.each( elements, function(){
				if( this[mark] ){
					if( $.browser('ie6 ie7') ){
						this.removeAttribute( mark );
					}else{
						delete this[mark];
					}
				}
			})
		}
		return elems;
	}
	
	$.extend = $.fn.extend = function(){
		/*
		 * 合并对象,扩展方法
		 */
		var arg = arguments,
			target = arg[0] || {},
			child = arg[1],
			length = arg.length,
			i;
		if(length==1){
			for( i in target ){
				this[i] = target[i];
			}
		}else if( length>1 && $.type(child) == 'object' ){
			for( i in child ){
				if( child[i] === undefined ){
					continue;
				}
				target[i] = child[i];
			}
		}
		
		return target;	
	}
	
	$.extend({
		type : function( object ){
			//检测对象类型
			if( object == null ) {//null或undefined
				return String( object );
			}else if( object.nodeType ){//element
				return 'element';
			}
			var str = Object.prototype.toString.call( object ); // 获取参数类型字符串
			return str.slice( 8, str.length-1 ).toLowerCase();
		},
		
		trim : function( string ){
			//去除字符串两端空格
			var reg = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
			string =  string ? ( string + '' ) : '';
			return str_trim ? str_trim.call(string) : string.replace(reg,'');
		},
		
		browser : function(){
			//检测浏览器
			var u = navigator.userAgent.toLowerCase(),
			fn = {
				version:(u.match(/(?:firefox|opera|safari|chrome|msie)[\/: ]([\d.]+)/))[0],//浏览器版本号
			    safari:/version.+safari/.test(u),
			    chrome:/chrome/.test(u),
			    firefox:/firefox/.test(u),
			    ie:/msie/.test(u),
				ie6:/msie 6.0/.test(u),
				ie7:/msie 7.0/.test(u),
				ie8:/msie 8.0/.test(u),
				ie9:/msie 9.0/.test(u),
			    opera: /opera/.test(u) 
			}, state = false;
			return function( name ){
				//多个用逗号隔开 如'ie6 ie7'
				name = name.split(' ');
				$.each( name, function( i, val ){
					if( fn[ val ] ){
						state = true;
						return false;
					}
				})
				return state;
			}
		}(),
		
		each : function( object, fn ){
			//遍历对象
			//return false退出循环
			if(!object){
				return object;
			}
			var i = 0,
				length = object.length;
				
			if( length===0 ){
				return object;
			}
			if( length && typeof length == 'number' ){
				for( ; i<length; i++ ){
					if( fn && fn.call( object[i], i, object[i] ) === false ){
						break;
					}
				}
			}else if( $.type( object ) == 'object' ){
				
				for ( i in object){
					if( fn && fn( i, object[i] ) === false ){
						break;
					}
				}
			}
			return object;
		},
		
		hasClass : function( elem, name ){
			//检测元素是否含有class,多个以空格隔开，不限顺序
			var has = false;
			name = typeof name==='string' ? name.split(' ') : [];
			$.each( name, function(){
				if ( elem.nodeType === 1 && (' ' + elem.className + ' ').indexOf( ' ' + this + ' ' ) >= 0 ) {
					has = true;
				}
			})
			return has;
		},
		
		is : function( elem, selector ){
			var s = $.css( elem, 'display' ),
				hide = s==='none';
			if( typeof selector === 'string' ){
				if( (selector == ':hidden' && hide) || (selector == ':visible' && !hide) ){
					return true;
				}
			}
			return false;
		},
		
		cookie : function( name, value, options ){
			/*
			 * 读取cookie值: nojs.fn.cookie("key"); 
			 * 设置/新建cookie的值:	nojs.fn.cookie("key", "value");
			 * 新建一个cookie 包括有效期(天数) 路径 域名等:nojs.fn.cookie("key", "value", {expires: 7, path: '/', domain: 'a.com', secure: true});
			 * 删除一个cookie:nojs.fn.cookie("key", null);	
			 */		
			if (typeof value != 'undefined') {
		        options = options || {};
		        if (value === null) {
		            value = '';
		            options.expires = -1;
		        }
		        var expires = '';
		        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
		            var date;
		            if (typeof options.expires == 'number') {
		                date = new Date();
		                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
		            } else {
		                date = options.expires;
		            }
		            expires = '; expires=' + date.toUTCString();
		        }
		        var path = options.path ? '; path=' + (options.path) : '';
		        var domain = options.domain ? '; domain=' + (options.domain) : '';
		        var secure = options.secure ? '; secure' : '';
		        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
		    } else { 
		        var cookieValue = null;
		        if (document.cookie && document.cookie != '') {
		            var cookies = document.cookie.split(';');
		            for (var i = 0; i < cookies.length; i++) {
		                var cookie = $.trim(cookies[i]);
		                if (cookie.substring(0, name.length + 1) == (name + '=')) {
		                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
		                    break;
		                }
		            }
		        }
		        return cookieValue;
		    }
		}
	})
	
	_root = $(document);
	//_root.root = true;
	
	$.each({
		children : {
			'first' : 'firstChild',
			'second' : 'nextSibling'
		},
		parents : {
			'first' : 'parentNode'
		},
		parent : {
			'first' : 'parentNode',
			'each' : false
		},
		siblings : {
			'first' : 'parentNode',
			'second' : 'nextSibling',
			'node' : function( elem ){
				return elem.firstChild;
			},
			'continue' : function( elem, self ){
				return elem === self;
			}
		},
		next : {
			'first' : 'nextSibling',
			'break' : function( elem ){
				return elem.nodeType == 1;
			}
		},
		prev : {
			'first' : 'previousSibling',
			'break' : function( elem ){
				return elem.nodeType == 1;
			}
		},
		nextAll : {
			'first' : 'nextSibling'
		},
		prevAll : {
			'first' : 'previousSibling'
		}
	}, function( name, fn ){
		var _first = fn['first'],
			_second = fn['second'] || _first,
			_node = fn['node'],
			_each = fn['each'] === false ? false : true,
			_continue = fn['continue'],
			_break = fn['break'];
			
		$[ name ] = function( elem ){
			var elems = [],
				node;
				
			node = elem[ _first ];
			node = _node ? _node( node, elem ) : node;
			if( !node ) {return elems;}
			if( _each ){
				for( ; node; node = node[ _second ] ){
					if( _continue && _continue( node, elem ) ){
						continue;
					}
					push();
					if( _break && _break( node, elem ) ){
						break;
					}
				}
			}else{
				push();
			}	
			function push(){
				node.nodeType==1 && elems.push( node );
			}
			return elems;
		}
		$.fn[ name ] = function( selector ){
			var elems = [];
			this.each(function(){
				arr_push.apply( elems, $[name]( this ) );
			})
			
			elems = Selector( elems, name, $.trim(selector) );
			
			return this.addBranch( elems, name, selector );
		}
	});
	
	(function( window, undefined ){
		/*
		 * 元素css操作
		 * clientWidth=width+padding  网页可见区域宽
		 * offsetWidth=width+padding+border
		 */
		var _window = {
			'width' : 'clientWidth',
			'outerWidth' : 'clientWidth',
			'height' : 'clientHeight',
			'outerHeight' : 'clientHeight'
		},
		//除了以下属性外，其他值为数字的都要加 px 为单位
		cssNumber = {
			"fillOpacity": true,
			"fontWeight": true,
			"lineHeight": true,
			"opacity": true,
			"orphans": true,
			"widows": true,
			"zIndex": true,
			"zoom": true
		},
		
		rtype = /^(?:button|input)$/i,
		sizeGroup = {
			'width' : [ 'paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth', 'marginLeft', 'marginRight' ], 
			'height' : [ 'paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth', 'marginTop', 'marginBottom' ], 
			'outerWidth' : [], 
			'outerHeight' : []
		};
		
		router = /^outer/;
		
		function getStyle( elem, name ){
			var style = {};
			
			//window或document的尺寸均为可见区域尺寸
			if( elem === window || elem === document ){
				elem = document.documentElement;
				if( name ){
					return elem[ _window[name] ];
				}else{
					for( var i in _window ){
						style[i] = elem[ _window[i] ];
					}
					return style;
				}				
			}
			if( !elem || elem.nodeType!=1 ){
				return name ? null : style;
			}
			if( window.getComputedStyle ){
				style = window.getComputedStyle( elem, null );
			}else if( document.documentElement.currentStyle ){//ie,opera
				style = elem.currentStyle;
			}
			return name ? style[ name ] : style;
		}
		
		function _parseInt( value ){
			return parseInt( value, 10 ) || 0;
		}
		
		function parseAttr( attr ){
			//格式化css属性名称
			//padding-left => paddingLeft
			//-webkit-animation-delay => webkitAnimationDelay
			return attr.replace(/^\-/,'').replace(/(-)(\w)/g,function(){return arguments[2].toUpperCase()});
		}
		
		
		$.extend({
			css : function( elem, name ){
				if( typeof name === 'string' ){
					return getStyle( elem, name );
				}else if( $.type(name) === 'object' ){
					//set all
					if( !elem || elem.nodeType!=1 ){
						return;
					}
					$.each( name, function( i, val ){
						if( !val && val!=0 ){
							return;
						}
						if(i=='class'){
							elem.className = val;
						}else{
							i = parseAttr(i);
							//val = parseFloat( val );
							if( i=='width' || i=='height' ){
								val = val == 'auto' ? val : parseFloat( val ) || 0;
								val = val<0 ? 0 : val;
							}
							if( typeof val == 'number' && !cssNumber[i] ){
								val += 'px';
							}
							elem.style[i] = val;
						}
					})
				}
			},
			getStyle : getStyle,
			createCss : function( rules ){
				var styleElement = document.createElement('style');
				styleElement.type = 'text/css';
				if ( $.browser('ie') ) {//判断IE浏览器
					styleElement.styleSheet.cssText = rules;
				}else{
					var frag = document.createDocumentFragment();
					frag.appendChild(document.createTextNode(rules));
					styleElement.appendChild(frag);
				}
				function append() {
					document.getElementsByTagName('head')[0].appendChild(styleElement);
				}
				append();
			}
		})
		
		$.each( sizeGroup, function( key, val ){
			
			var is = router.test( key );
			$.fn[ key ] = function( value ){
				key = is ? key.replace(router ,'').toLowerCase() : key;
				val = sizeGroup[ key ];
				
				var elem = this[0],
					style = getStyle( elem ),
					//width|height
					size, 
					//+padding
					inner,
					outer, Outer,
					position, oldStyle, newStyle;
					
				size = style[key];
				size = size=='auto' ? 'auto' : _parseInt( style[key] );
				inner = size;
				
				if( style.display=='none' && (size==0||size=='auto') ){
					//对于隐藏元素，且css未定义尺寸的,无法直接获取到尺寸
					//需要移出文档流显示并设置visibility:hidden
					//position为fixed或者absolute的可以直接用display:block然后获取尺寸
					//其他的元素设置position：absolute即可，但块元素会存在问题，因为原先的尺寸默认由其父元素决定
					
					oldStyle = $.attr( elem, 'style' );//保存原先style属性
					newStyle = { 'visibility':'hidden', 'display':'block' };
					
					position = style['position'];
					if( position!='absolute' && position!='fixed' ){
						newStyle['position'] = 'absolute';
					}
					
					$.css( elem, newStyle );
					size = _parseInt( style[key] );
					getSize();
					
					//还原style
					oldStyle ? $.attr( elem, {
						'style' : oldStyle
					}) : elem.setAttribute('style','');
					
				}else{
					getSize();
				}
				
				function getSize(){
					//ie无法正常获取尺寸
					if( size==0||size=='auto' ){
						size = elem[ key=='width' ? 'clientWidth' : 'clientHeight' ];
						if( !rtype.test(elem.nodeName) ){
							size -= _parseInt( style[val[0]] ) + _parseInt( style[val[1]] );
						}	
					}
					inner = size;
				}
				//key=='width'&&console.log(inner)
				
				
				if( rtype.test(elem.nodeName) ){
					size -= _parseInt( style[val[0]] ) + _parseInt( style[val[1]] );
				}else{//button input边框填充不计算在尺寸内
					inner += _parseInt( style[val[0]] ) + _parseInt( style[val[1]] );
				}
				
				if( is ){
					//+border
					outer = inner;
					if( !rtype.test(elem.nodeName) ){
						outer += _parseInt( style[val[2]] ) + _parseInt( style[val[3]] );
					}
					
					//+margin
					Outer = outer + _parseInt( style[val[4]] ) + _parseInt( style[val[5]] );
				}
				
				if( value === undefined ){
					return is ? outer : size;
				}else if( value === true ){
					return is ? Outer : inner;
				}else if( !is ){
					//set all
					if( parseFloat( value ) ){
						value = parseFloat( value ) + 'px';
					}
					return this.each(function(){
						this.style[ key ] = value;
					})
				}
				
			}
		})
		
		$.fn.extend({
			css : function( name ){
				return typeof name === 'string' ? $.css( this[0], name ) : this.each(function(){
					$.css( this, name );
				});
			},
			scrollTop : function( value ){
				var elem = this[0];
				if( value === undefined ){
					return elem.scrollTop || 0;
				}else{
					//set all
					value = _parseInt( value ) + 'px';
					return this.each(function(){
						this.scrollTop = value;
					})
				}
			},
			scrollLeft : function( value ){
				var elem = this[0];
				if( value === undefined ){
					return elem.scrollLeft || 0;
				}else{
					//set all
					value = _parseInt( value ) + 'px';
					return this.each(function(){
						this.scrollLeft = value;
					})
				}
			},
			offset : function( position ){
				/*
				 * 获取元素相对于当前视口body的偏移量
				 * @position:为true时相对于自身offsetParent的偏移量
				 */
				var elem = this[0],
					par = elem.offsetParent,
					left = elem.offsetLeft || 0,
					top = elem.offsetTop || 0;
					
				if( position === undefined ){
					for( ; par; par = par.offsetParent ){
						left += par.offsetLeft - par.scrollLeft;
						top += par.offsetTop - par.scrollTop;
						if( par === document.body ){
							break;
						}
					}
				}
				
				return {
					top : top,
					left : left
				}
			}
		})
	})( window );
	
	(function( window, undefined ){
		/*
		 * 元素属性操作
		 * setAttribute|getAttribute|removeAttribute处理class时均要区分ie8以下为className,其他class
		 */
		function getAttrName( name ){
			return name === 'class' ? 
				(typeof document.body.getAttribute('className') === 'string' ? 'className' : 'class') : name;
		}
		
		$.extend({
			attr : function( elem, name ){
				var attr;
				if(typeof name === 'string'){
					attr = elem && elem.getAttribute( getAttrName(name) );
					return typeof attr=='string' ? attr : '';
				}else if( $.type(name) === 'object' ){
					//set all
					$.each( name, function( i, val ){
						elem.setAttribute( getAttrName(i), val );
					})
				}
			}
		})
		
		$.fn.extend({
			attr : function( name ){
				return typeof name === 'string' ? $.attr( this[0], name ) : this.each(function(){
					$.attr( this, name );
				});
			},
			removeAttr : function( name ){
				//set all
				//删除多个属性用空格隔开
				var T;
				name = typeof name==='string' ? name.split(' ') : []
				return this.each(function(){
					T = this;
					$.each( name, function( i, val ){
						if(T.nodeType!=1){return;}
						T.removeAttribute( getAttrName(val) );
					})
				})
			},
			addClass : function( name ){
				//多个class用空格隔开
				var T,self = this;
				name = typeof name==='string' ? name.split(' ') : [];
				return this.each(function(){
					T = this;
					$.each( name, function( i, val ){
						if( !$.hasClass( T, val ) ){
							T.className = T.className + ' ' + val;
						}
					})
				})
			},
			removeClass : function( name ){
				//多个class用空格隔开
				if( typeof name !== 'string' ){
					return this;
				}
				name = name.split(' ').join(' | ');
				var reg = new RegExp( ' ' + name + ' ', 'g' ),
					className;
				return this.each(function(){
					className = ' ' + this.className + ' ';
					this.className = $.trim( className.replace(reg,' ') );
				})
			},
			html : function( value ){
				// value ? set : get
				var elem = this[0];
				if( value == undefined ){
					return elem ? elem.innerHTML : '';
				}
				//set all
				return this.each(function(){
					this.innerHTML = value;
				})
			},
			text : function( value ){
				// value ? set : get
				//firefox使用 textContent
				var elem = this[0],
					innerText = function(){
						return elem['textContent'] ? 'textContent' : 'innerText';
					};
				if( value == undefined ){
					return elem ? elem[innerText()] : '';
				}
				//set
				innerText = innerText();
				this.each(function(){
					this[innerText] = value;
				})
				return this;
			},
			val : function( value ){
				var elem = this[0],
					tag = elem.tagName.toLowerCase(),
					get = value === undefined;
					
				if( /input|textarea|button|select|option/.test( tag ) ){
					return get ? elem.value : this.each(function(){
						this.value = value;
					});
				}else{
					return get ? '' : this;
				}
			}
		})
	})( window );
	
	(function( window, undefined ){
		/*
		 * 文档操作
		 */
		function after( clone, elem ){
			var par = elem.parentNode,
				next = elem.nextSibling;
			next ? par.insertBefore( clone, next ) : par.appendChild( clone );
		}
		function before( clone, elem ){
			var par = elem.parentNode;
			par.insertBefore( clone, elem );
		}
		$.each({
			append : {
				'method' : 'appendChild'
			},
			appendTo : {
				'correct' : false, 'method' : 'appendChild'
			},
			prepend : {
				'method' : 'insertBefore'
			},
			prependTo : {
				'correct' : false, 'method' : 'insertBefore'
			},
			after : {
				'method' : after
			},
			before : {
				'method' : before
			},
			insertAfter : {
				'correct' : false, 'method' : after
			},
			insertBefore : {
				'correct' : false, 'method' : before
			}
		},function( name, fn ){
			var correct = fn['correct'] === false ? false : true,
				method = fn['method'];
				
			$.fn[ name ] = function( value ){
				/*
				 * @value:html|$|dom
				 * 反向操作时不支持html
				 */
				var T = this, wrap, clone, par, elems = [],
					insertWrap, insertElem, 
					isArray = T.length>1;//是否为多个元素集合
					
				if( !value || !T.length ){
					return this;
				}
				if( typeof value == 'string' ){
					if( !correct ){
						return this;
					}
					wrap = document.createElement('div');
					wrap.innerHTML = value;
					arr_push.apply( elems, wrap.childNodes );
					wrap = null;
					//wrap = document.createDocumentFragment();
					/prepend/.test( name ) && elems.reverse();//prepend 需要对数组反向排序
				}
				
				if( value.length && value[0] && value[0].nodeType ){
					//ie要将nojs对象转化为真正的数组
					value = value instanceof $ ? arr_slice.call(value) : value;
					arr_push.apply( elems, value );
				}else if( value.nodeType ){
					arr_push.call( elems, value );
				}
				
				if( !elems.length ){
					return this;
				}
				
				return this.each(function(){
					if( correct ){
						insertWrap = this;
					}else{
						insertElem = this;
					}
					$.each( elems, function(){
						insertElem = correct ? this : insertElem;
						//元素插入是个移动过程，多次需要拷贝副本
						//*************如该元素上需要添加事件或其他数据时，需要先添加在进行文档操作***********
						clone = isArray ? insertElem.cloneNode( true ) : insertElem;
						
						insertWrap = correct ? insertWrap : this;
						typeof method === 'string' ? 
							insertWrap[ method ]( clone, insertWrap.firstChild ) : 
							method( clone, insertWrap );
						
						if( isArray ){
							par = insertElem.parentNode;
							par && par.removeChild( insertElem );//removeChild只是从dom中移除，仍可再次调用
						}
					})
				})
			}
		})
		
		$.fn.extend({
			empty : function(){
				return this.each(function(){
					this.innerHTML = '';
				})
			},
			remove : function( removeAll ){
				var par;
				return this.each(function(){
					par = this.parentNode;
					par && par.removeChild( this );
				})
			},
			clone : function( cloneAll ){
				var elems = [];
				this.each(function(){
					elems.push( this.cloneNode( true ) );
				})
				return this.addBranch( elems );
			},
			wrapInner : function( elem ){
				var content,wrap;
				return this.each(function(){
					wrap= $(elem).first();
					while ( wrap.firstChild && wrap.firstChild.nodeType === 1 ) {
						wrap = wrap.firstChild;
					}
					content = this.childNodes;
					wrap.append(content).appendTo(this);
				})
			}
		})
		
	})( window );
	
	(function( window, undefined ){
		/*
		 * 事件添加及删除
		 * 并非所有事件都支持冒泡或捕获 (onload,unload,focus,blur,submit,change是不支持冒泡的)
		 * ie不支持捕获
		 */
		var //匹配3种事件类别：单个事件|多个事件逗号隔开|含有命名空间 
			eventreg = /^(?:([\w]+)|([\w]+[\w\s]+[\w]+)|([\w]+\.[\w]+))$/,
			//替换命名空间
			namespace = /\.[\w]*/,
			//事件属性标识符
			eventAttr = 'nojs_event_item';
		
		$.extend({
			target : function( e ){
				//获取事件的对象源
				return e.target || e.srcElement;
			},
			stopDefault : function( e ){
				//取消事件的默认动作
				if ( e.preventDefault ) {
					e.preventDefault();
				} else {
					e.returnValue = false;
				}
			},
			stopBubble : function( e ){
				//阻止冒泡
				if ( e.stopPropagation ){
					e.stopPropagation();
				}else{
					e.cancelBubble = true;
				}
			}
		})
		
		$.fn.extend({
			on : function( type, handler ){
				/*
				 * 添加事件
				 */
				var match, eventArr = [], T, name, item, _handler;
				
				if( !handler || !this.length || typeof type !== 'string' ){
					return this;
				}
				type = $.trim( type );
				match = eventreg.exec( type );
				
				if(!match){
					return this;
				}
				if( match[1] || match[3] ){
					//绑定单个事件 || 为事件添加命名空间
					eventArr.push( match[1] || match[3] );
				}else if(match[2]){
					//同时添加多个事件
					arr_push.apply( eventArr, match[2].split(' ') );
				}
				
				return this.each(function(){
					T = this;
					item = T[ eventAttr ];
					if( !item ){
						item = T[ eventAttr ] = {};
					}
					!function(T){
						_handler = function(e){
							e = e || window.event;
							if( handler.call( T, e ) == false ){
								//手动触发事件时 e 无值
								e && $.stopDefault( e );
							}
						}
						_handler.handler = handler;
					}(this);
					
					$.each( eventArr, function( i, e ){
						item[ e ] = item[ e ] || [];
						item[ e ].push( _handler );
						
						name = e.replace( namespace, '' );
						item[ name ] = item[ name ] || [];
						if( e!==name ){//使用命名空间时，同时也往它的父类事件列表中添加一次
							item[ name ].push( _handler );
						}
						
						if( T.addEventListener ){
							T.addEventListener( name, _handler, false );
						}else if( T.attachEvent ){
							T.attachEvent( 'on' + name, _handler );
						}else{
							T[ 'on' + name ] = _handler;
						}
						
					})
					
				});
			},
			off : function( type, handler ){
				/*
				 * 移除事件
				 * @handler:fn 使用匿名函数无法有效移除事件
				 */
				var T, item, name,
					_handler = $.type(handler) === 'function';
				
				type = type || '';
				
				if( typeof type == 'string' ){
					type = $.trim( type );
					name = type.replace( namespace, '' );
				}else{
					return this;
				}
				
				function each( _item ){
					_item = _item || [];
					
					$.each( _item, function( i, e ){
						//没有指定事件时，移除同类所有事件
						
						if( !_handler || ( _handler && handler===e.handler ) ){
							if( T.removeEventListener ){
								T.removeEventListener( name, e, false );
							}else if( this.detachEvent ){
								T.detachEvent( 'on' + name, e );
							}else{
								T[ 'on' + name ] = null;
							}
							_item[i] = null;
							if( _handler && handler===e.handler ){//退出
								return false;
							}
						}
					})
				}
				return this.each(function(){
					T = this;
					item = this[ eventAttr ] || {};
					
					if( type=='' ){//不指定事件类型，移除所有事件
						$.each( item, function( key, val ){
							type = key;
							name = type.replace( namespace, '' );
							each( val );
						})
						this[ eventAttr ] = item = null;
					}else{
						each( item[ type ] );
					}

					if( !_handler && this[ eventAttr ] ){
						this[ eventAttr ][type] = null;
					}
				})
			},
			trigger : function( type ){
				//手动触发事件
				var event,T;
				if( !type || typeof type !== 'string' ){
					return this;
				}
				return this.each(function(){
					event = this[ eventAttr ];
					if( !event ){
						return;
					}
					T = this;
					event = event[ type ];
					$.each( event ,function( i, fn ){
						typeof fn == 'function' && fn.call(T);
					})
				})
			}
		})
		
		
		$.each( ("blur focus focusin focusout load resize scroll unload click dblclick " +
			"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave hover " +
			"change select submit keydown keypress keyup error contextmenu").split(" "), function( i, name ){
			
			$.fn[ name ] = function( fn ){
				var trigger = arguments.length == 0;
				if( name=='hover' ){
					return trigger ? this : this.on( 'mouseover', arguments[0] ).on( 'mouseout', arguments[1] );
				}else{
					return trigger ? this.trigger( name ) : this.on( name, fn );
				}
				
			}
		})
		
	})( window );
	
	(function( window, undefined ){
		/*
		 * 动画效果
		 */
		var //递增或递减
			passreg = /^[+-]=/,
			//支持动画的css属性及其分支属性
			attrreg = /margin|padding|opacity|width|height|left|top|bottom|right|border/,
			//动画属性标识符
			animateName = 'nojs_animate',
			elemDisplayCache = {},
			_time = 10;//interval间隔时间
		function defaultDisplay( nodeName ){
			//获取该类元素的默认显示属性
			if ( elemDisplayCache[ nodeName ] ) {
				return elemDisplayCache[ nodeName ];
			}
			
			var elem = document.body.appendChild( document.createElement(nodeName) ),
				display = $.css( elem, 'display' );
			document.body.removeChild( elem );
			
			elemDisplayCache[ nodeName ] = display;
			
			return display;
		}
		
		$.extend({
			animate　: function( elem, prop, speed, easing, callback ){
				var name = elem[ animateName ] = {};
				speed = speed || 400;//fast:200 normal:400 fast:600
				speed /= _time;//总次数	
				if(typeof easing === 'function'){
					callback = easing;
					easing = null;
				}
				elem['callback'] = callback;
				
				$.each( prop, function( attr, target ){
					var value, dif, step, css = {};
					
					if( !attrreg.test(attr) ){
						return;
					}
					//@value:attr当前值
					value = parseFloat( $.css( elem, attr ) );
					
					//@target:目标值
					if( passreg.test(target) ){
						target = target.replace('=','');
						target = value + parseFloat( target );
					}else{
						target = parseFloat( target );
					}
					
					dif = target - value;//差值
					if( dif==0 ){
						return;
					}
					
					css[attr] = value + 'px';
					step = 1.4*dif/speed;//每次改变的步长
					
					name[attr] = setInterval(function(){
						
						if( (step>0 && value>=target) || (step<0 && value<=target) ){
							name[attr] = clearInterval( name[attr] );
							css[attr] = target;
							$.css( elem, css );
							
							elem['callback'] && !function(){
								elem['callback'].call( elem );
								elem['callback'] = null;
							}();
							return;
						}
						value += step;
						css[attr] = value;
						$.css( elem, css );
						
					}, _time);
					
				})
			},
			show : function( elem ){
				var display, style;
				if( $.is( elem, ':hidden' ) ){
					display = { 
						'display' : defaultDisplay( elem.tagName ) 
					};
					
					if( elem.style.display == 'none' ){//内联样式
						style = $.attr( elem, 'style' ).replace( /display\s?:\s?none;?/, '' );
						$.attr( elem, { 'style' : style } );
						
						//内联样式和外部同时定义
						if( $.is( elem, ':hidden' ) ){
							$.css( elem, display );
						}
					}else{//css中定义
						$.css( elem, display );
					}
				}
			}
		})
			
		$.fn.extend({
			animate : function( prop, speed, easing, callback ){
				if( !prop || $.type(prop)!=='object' ){
					return this;
				}
				return this.each(function(){
					$.animate( this, prop, speed, easing, callback );
				})
			},
			stop : function(){
				var name;
				return this.each(function(){
					name = this[ animateName ];
					$.each( name, function( attr, tick ){
						name[attr] = clearInterval( tick );
					})
					this[ animateName ] = null;
				})
			},
			fadeIn : function( speed, fn ){
				//淡出显示
				return this.css( {'opacity':'0'} ).show().animate({
					'opacity' : '1'
				}, speed, fn );
			},
			fadeOut : function( speed, fn ){
				//淡入隐藏
				var T = this;
				return this.animate({
					'opacity' : '0'
				}, speed, function(){
					T.hide();
					fn && fn();
				});
			},
			fadeTo : function( speed, opacity, fn ){
				//只调节透明度
				return this.animate({
					'opacity' : opacity
				}, speed, fn );
			},
			show : function(){
				return this.each(function(){					
					$.show( this );
				});
			},
			hide : function(){
				return this.css({'display':'none'});
			},
			slideDown : function(){
				/*
				 * animate : height,padding,margin
				 * 回调：还原style属性
				 */
				var arg = arguments,
					_arg, height, _style;
				return this.each(function(){
					if( $.is( this, ':visible' ) ){
						return;
					}
					//$.show( this );
					height = $(this).height();					
					this.style.height = 0;
					this.style.display = 'block';
					
					_arg = arr_slice.call( arg );
					_arg.unshift( this, {'height':height} );
					
					$.animate.apply( this, _arg );
				})
			}
		})
			
	})( window );
	
	(function( window, undefined ){
		/*
		 * ajax操作
		 */
		//var rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
		
		$.config.ajax = {
			type : 'post',
			dataType : 'json',
			async : true
		}
		
		$.extend({
			parseJSON : function( data ){
				var obj;
				if( typeof data === 'string' ){//string to json
					obj = {};
					data = data.split('&');
					$.each( data, function( i, val ){
						val = val.split('=');
						obj[ val[0] ] = val[1];
					})
					return obj;
				}else if( $.type(data) === 'object' ){//json to string
					obj = [];
					$.each( data, function( i, val ){
						obj.push( i+'='+val );
					})
					return obj.join('&');
				}
				return data;
			},
			
			ajax : function( options ){
				options = $.extend( $.config.ajax, options );
				
				var xmlHttp, status, response,
					url = options.url,
					type = String( options.type ).toLowerCase() === 'get' ? 'get' : 'post',
					dataType = options.dataType,
					success = options.success,
					data = options.data || {},
					async = options.async;//是否异步
					
				url	= typeof url === 'string' ? $.trim(url) : null;
				
				if( !url ){
					return;
				}
				
				function createXMLHttpRequest() {    
				    if (window.ActiveXObject) {//ie 
				        return new ActiveXObject("Microsoft.XMLHTTP");    
				    }else if (window.XMLHttpRequest) {    
				        return new XMLHttpRequest();
				    }    
				} 
				xmlHttp = createXMLHttpRequest();//发送请求
				
				if( !xmlHttp ){
					return;
				}
				
				xmlHttp.onreadystatechange = function(){
					if(xmlHttp.readyState === 4){
						status = xmlHttp.status;
						if( (status>=200 && status<300) || status === 304 || status === 1223 ){
							response = xmlHttp.responseText;
							if( dataType === 'json' ){//json格式解析
								response = eval("("+response+")"); 
							}
							success && success( response );
						}
					}
				}
				if( data && type=='get' ){
					url += '?' + $.parseJSON( data );
				}
				xmlHttp.open( type, url, async );
				data = type === 'get' ? null : data;
				xmlHttp.send( data );
			}
			
		})
		
		$.fn.extend({
			loadHtml : function( url, data, callback ){
				if ( typeof url !== "string" || !this.length ) {
					return this;
				}
				
				var type = 'get', 
					T = this,
					text, _script, script;
				
				if( typeof data === 'function' ){
					callback = data;
					data = null;
				}else if ( data && typeof data === "object" ) {
					type = "post";
				} 
				$.ajax({
					url : url,
					type : type,
					dataType : "html",
					data : data,
					success : function( response ) {
						//text = response.replace( rscript, '' );
						T.html( response );
						T.each(function(){
							var t;
							//IE使用window.execScript执行script
							_script = this.getElementsByTagName('script');
							if( $.browser('ie6 ie7 ie8') ){
								//script = document.createElement( '<script defer>'+_script.innerHTML+'</script>' );
							}else{
								//script = document.createElement( 'script' );
								//script.innerHTML = _script.innerHTML;
							}
							//script.setAttribute('defer','defer');
							//this.removeChild( _script );
							//this.insertBefore( script, _script.nextSibling );
							//$(this).append( script );
							$.each( _script, function( i, s ){
								t = s.type;
								if( !t || t=='text/javascript' ){
									eval("("+s.innerHTML+")");
								}
							})
						});
						callback && callback();
					}
				})
				return this;
			}
		})
		
	})( window );
	
	window.$ = window.nojs = $;
})( window );
