/*
	@fengc 2016/10/4
	touch类
	@param {DOM Object} container dom对象
	@param {Function} startFn touchstart触发
	@param {Function} moveFn touchmove触发
	@param {Function} endFn touchend触发
	@discussion
	var touch = new _utils.Touch(document.getElementById('dom'),{
		touchstart : function(e, touch){ touch.dragging = true;},
		touchmove : function(e, touch){ },
		touchend : function(e, touch){}
	}
	touch.init();
*/
(function(global, factory){
	if(!global._utils){
		global._utils = {};
	}
	global._utils.TouchClass = factory();
})(this, function(){
	'use strict';
	var Touch = function (container, opts) {
		this.container = container;
		this.draging = false;
		this.pos = {
			startX : 0,
			startY : 0,
			targetX : 0,
			targetY : 0
		};
		this.distance = 0;
		this.direction = 0;     //期望方向, 1 左, 2 右, 3 上, 4 下
		this.isslider = false;
		this.opts = {
			touchstart : opts.touchstart,
			touchmove : opts.touchmove,
			touchend : opts.touchend
		};
	};
	Touch.prototype = {
		init: function () {
			this.timeStamp = 0;    //touchmove到touchend的速度
			this.on();
		},
		on: function () {
			this.container.addEventListener('touchstart', this.touchStart(this));
			this.container.addEventListener('touchmove', this.touchMove(this));
			this.container.addEventListener('touchend', this.touchEnd(this));
		},
		off: function() {
			this.container.removeEventListener('touchstart', this.touchStartHandler);
			this.container.removeEventListener('touchmove', this.touchMoveHandler);
			this.container.removeEventListener('touchend', this.touchEndHandler);
		},
		touchStart: function (touch) {
			return touch.touchStartHandler = function(e){
				var point = e.touches[0];
				touch.pos.startX = touch.pos.targetX = point.clientX;
				touch.pos.startY = touch.pos.targetY = point.clientY;
				touch.opts.touchstart(e, touch);
			};
		},
		touchMove: function (touch) {
			return touch.touchMoveHandler = function(e){
				if(!touch.draging) return;
				var x = e.touches[0].clientX,
					y = e.touches[0].clientY,
					level, vertical,
					d = 0;
				if(touch.pos.startX != x || touch.pos.startY !== y){
					touch.timeStamp = e.timeStamp | 0;
					if(touch.direction === 0){
						level = x > touch.pos.startX ? 2 : 1;   //优先左
						vertical = y < touch.pos.startY ? 3 : 4;    //优先下
						d = Math.abs(x - touch.pos.startX) > Math.abs(y - touch.pos.startY) ? 0 : 1;    //优先上下
						touch.direction = d === 0 ? level : vertical;
					}
					touch.pos.targetX = x;
					touch.pos.targetY = y;
					touch.distance = x - touch.pos.startX;

					// 左右
					if(touch.direction === 1 || touch.direction === 2){
						// 左右滑时不应该能上下滑
						// e.preventDefault();
						// e.stopPropagation();
						touch.pos.targetY = 0;
						// touch.opts.moveFn(e, touch);
					}
					// 上下
					else if(touch.direction === 3 || touch.direction === 4){
						// 上下滑时不应该能左右滑
						touch.pos.targetX = 0;
					}

					touch.opts.touchmove(e, touch);
				}else{
					e.preventDefault();
					e.stopPropagation();
				}
			};
		},
		touchEnd: function (touch){
			return touch.touchEndHandler = function(e){
				touch.draging = false;
				touch.isslider = (e.timeStamp | 0) - touch.timeStamp < 20 ? true : false;    //根据时间戳判断滑动的速度(时间)
				touch.opts.touchend(e, touch);
				touch.pos.startX = touch.pos.startY = touch.pos.targetX = touch.pos.targetY = touch.distance = touch.direction = touch.timeStamp = 0;
				touch.isslider = false;
			}
		},
		touchStartHandler: null,
		touchMoveHandler: null,
		touchEndHandler : null
	};
	return Touch;
});