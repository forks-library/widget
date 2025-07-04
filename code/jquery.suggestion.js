/**
 * jquery.suggestion.js 1.5
 * http://jquerywidget.com
 */
;(function (factory) {
    if (typeof define === "function" && define.amd){
		// AMD
        if (typeof jQuery === 'undefined') {
			define(['jquery'],factory);
        }else{
	        define(function(){
	            factory(jQuery);
	        });
        }
	}else if (typeof define === "function" && define.cmd){
		// CMD
        if (typeof jQuery === 'undefined') {
			define(function(require){
				var jQuery = require('jquery');
	            factory(jQuery);
	        });
        }else{
	        define(function(){
	            factory(jQuery);
	        });
        }
    } else if (typeof module === 'object' && module.exports) {
        // Node/CommonJS
        module.exports = function( root, jQuery ) {
            if (typeof jQuery === 'undefined') {
                if (typeof window !== 'undefined' ) {
                    jQuery = require('jquery');
                } else {
                    jQuery = require('jquery')(root);
                }
            }
            factory(jQuery);
            return jQuery;
        };
    } else {
        //Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.fn.suggestion = function(parameter,getApi) {
        if(typeof parameter == 'function'){ //重载
            getApi = parameter;
            parameter = {};
        }else{
            parameter = parameter || {};
            getApi = getApi||function(){};
        }
        var defaults = {
            url:'',                          //请求的接口地址
            suggestionCls:'suggestion',      //提示框的内容class
            activeCls:'active',              //列表项选中class
            triggerNode:'li',                //节点调整
            dynamic:true,                    //动态
            fieldName:'word',                //当前input表单项在请求接口时的字段名
            dataType:'jsonp',                //请求的格式
            parameter:{},                    //其他与接口有关参数
            jsonp:'callback',                //传递自定义回调函数
            jsonpCallback:'',                //自定义回调函数
            autoSubmit:true,                 //点击确定是否自动提交表单
            itemFormat:function(item){          //建议列表节点样式
                return item['name'];
            },
            beforeSend:function(){},            //发送前动作：传入准备提交的表单项目，返回false终止提交
            onCallback:function(){},            //获得数据后触发：target表示被建议列表对象,data表示请求到的数据
            onChange:function(item){                //用户按键盘切换时触发
                return item['value'];
            },
            onSelect: function(item) {              //选中搜索建议列表项触发：传入一个对象，target表示当前选中列表项,input表示当前input表单项
                return item['value'];
            }
        };
        var options = $.extend({}, defaults, parameter);
        var $window = $(window);
        var $document = $(document);
        return this.each(function() {
            // 对象定义
            var _api = {};
            var _ = this;
            var $this = $(this);
            var $form = $this.parents('form')||$this.parent();
            var $box = $this.parent();
            var $suggestion = $("<div class='"+options.suggestionCls+"'><ul></ul></div>").appendTo($box);
            var $list = $suggestion.find('ul');
            var $items = $list.find('li');
            var _height = $this.outerHeight(false);
            var _width = $this.outerWidth(false);
            var _text = null;
            var _hander = {};
            var _index = -1;
            var isShow = false;
            var hasData = false;
            // 节点样式
            $form.css({
                'position':'relative'
            });
            var _top = $this.position().top;
            var _left = $this.position().left;
            $this.prop({
                'autocomplete':'off',
                'disableautocomplete':true
            });
            $suggestion.css({
                'position':'absolute',
                'z-index':'999',
                'display':'none'
            });
            // 方法定义
            // 位置调整
            var reset = function(){
                _height = $this.outerHeight(false);
                _width = $this.outerWidth(false);
                _top = $this.position().top;
                _left = $this.position().left;
                $suggestion.css({
                    'top':_top+_height+'px',
                    'left':_left+'px',
                    'width':_width+'px'
                });
            };
            // 按键按下
            var down = function(e){
                e.isPropagationStopped();
                switch(e.keyCode){
                    case 13:
                        _api.hide();
                        if(_index>=0){
                            var $target = $items.eq(_index);
                            var data = {
                                'name':$target.data('name'),
                                'value':$target.data('value'),
                            };
                            var result = options.onSelect(data);
                            if(result!=false){
                                $this.val(result);
                                $this.data('value',data.value);
                            }
                        }
                        if(!options.autoSubmit){
                            e.preventDefault();
                        }
                    break;
                    case 38:
                        if(isShow){
                            if(_index>0){
                                _index--;
                                $items.eq(_index).addClass(options.activeCls).siblings().removeClass(options.activeCls);
                                change();
                            }else{
                                _index = -1;
                                $items.removeClass(options.activeCls);
                                $this.val(_text);
                            }
                            e.preventDefault();
                        }
                    break;
                    case 40:
                        if(isShow){
                            if(_index<$items.length-1){
                                _index++;
                                $items.eq(_index).addClass(options.activeCls).siblings().removeClass(options.activeCls);
                                change();
                            }
                            e.preventDefault();
                        }
                    break;
                }
            };
            // 鼠标经过
            var hover = function(e){
                e.isPropagationStopped();
                var $target = $(this);
                _index = $target.index();
                $target.addClass(options.activeCls).siblings().removeClass(options.activeCls);
            };
            // 选中表单项
            function hasScrolled(element, direction) {
                if (direction === 'vertical') {
                    return element.scrollHeight > element.clientHeight;
                } else if (direction === 'horizontal') {
                    return element.scrollWidth > element.clientWidth;
                }
            }
            var change = function(){
                var $target = $list.find('li.'+options.activeCls);
                var data = {
                    'name':$target.data('name'),
                    'value':$target.data('value'),
                };
                var result = options.onChange.bind(_)(data);
                if(result!=false){
                    var $parent = $target.parent();
                    if(!hasScrolled($parent[0],'vertical')){
                        $parent = $parent.parent();
                    }
                    var top = $target.position().top+$parent.scrollTop();
                    var height = $target.outerHeight();
                    var outer_height = $parent.outerHeight();
                    var scroll_top = Math.max(top-outer_height/2+height/2,0);
                    $parent.scrollTop(scroll_top);
                    $this.val(result);
                    $this.data('value',data.value);
                }
            };
            // 成功后的回调函数
            var success = function(data){
                var list = options.onCallback.bind(_)(data);
                $list.empty();
                if(list&&list.length){
                    list.forEach(function(item){
                        $list.append('<li data-value="'+item['value']+'" data-name="'+item['name']+'">'+options.itemFormat(item)+'</li>');
                    });
                }
                $items = $suggestion.find('li');
                hasData = $items.length>0;        //根据列表长度判断有没有值
                if(hasData){
                    $suggestion.show();
                }else{
                    _api.hide();
                }
            };
            /* 公有方法 */
            // 显示表单项
            _api.show = function(){
                _hander['show']&&clearTimeout(_hander['show']);
                _hander['show'] = setTimeout(function(){
                    var value = $.trim($this.val());
                    if(options.dynamic){
                        if(value != _text){ //缓存上次输入
                            _index = -1;
                            if(options.fieldName){
                                options.parameter[options.fieldName] = _text = value;
                            }
                            if(options.beforeSend(options.parameter)!=false){
                                var param = {
                                    type:'get',
                                    async: false,
                                    url :options.url,
                                    data:options.parameter,
                                    dataType:options.dataType,
                                    jsonp:options.jsonp,
                                    success:success
                                };
                                if(options.jsonpCallback){
                                    param['jsonpCallback'] = options.jsonpCallback;
                                }
                                $.ajax(param);
                            }
                        }else{
                            if(hasData){
                                $suggestion.show();
                            }else{
                                _api.hide();
                            }
                        }
                    }else{
                        _index = -1;
                        success();
                    }
                    isShow = true;
                },250);
                return false;
            };
            // 隐藏表单项
            _api.hide = function(){
                _hander['hide']&&clearTimeout(_hander['hide']);
                _hander['hide'] = setTimeout(function(){
                    if(isShow){
                        $suggestion.hide();
                        isShow = false;
                    }
                },250);
            };
            // 事件绑定
            $this.on('keydown',down);
            $this.on('focus',function(){
                reset();
                _api.show();
            });
            $this.on('input propertychange',function(){
               _api.show();
            });
            $document.on('click',function(e){
                if(e.target!=_){
                    _api.hide();
                }
            });
            $list.on('click',options.triggerNode,function(){
                var $trigger = $(this);
                var $target = $trigger.closest('li');
                var data = {
                    'name':$target.data('name'),
                    'value':$target.data('value'),
                };
                var result = options.onSelect.bind(_)(data);
                if(result!=false){
                    $this.val(result);
                    $this.data('value',data.value);
                }
                if(options.autoSubmit){
                    $form.submit();
                }
                _api.hide();
                return false;
            }).on('mouseenter','li',hover);
            $window.resize(reset);
            // 初始化
            reset();
            getApi(_api);
        });
    };
}));