/*
	@fengc 2016/10/4
	9宫格手势解锁
	依赖touch.js
	var gesture = new _utils.DrawGesture(els[0], {
		unchosecolor : '#929394',	//未选中的圆圈颜色
		chosecolor : '#666',	//选中的圆圈颜色
		successcolor : '#7dc223',	//正确的圆圈颜色
		errorcolor : '#f4422f',	//错误的颜色
		chooseFn : function(){},	//每次选中一个圆环时触发，接受两个参数gesture, index
		touchend : function(){},		//在手指离开canvas时触发，应该在这里判断密码。接受一个参数gesture

		//画内圆, 如果没有该方法, 默认会画圆环
		drawInnerRound : function(gesture,ctx,x,y,r,pi){}
	});
	gesture.init();


*/

(function(global, factory){
	if(!global._utils){
		global._utils = {};
	}
	global._utils.DrawGesture = factory();
})(this, function(){
	'use strict';
	var DrawGesture = function(container, opts){
		var self = this;
		this.canvas = container;
		this.opts = opts;
		this.ctx = container.getContext('2d');
		this.matrixs = [0,0,0,0,0,0,0,0,0];
		this.rounds = [];
		this.orders = [];	//密码保存在这里
		this.devicePixelRatio = window.devicePixelRatio || 1;
		this.status = 0;	//重要的参数, 0 未选中, 1 选中, 2 成功, 3 错误
		this.rect = {};
		this.touch = new _utils.TouchClass(container,{
			touchstart : function(e, touch){
				touch.draging = true;
				touch.moveX = e.touches[0].clientX - self.rect.x;
				touch.moveY = e.touches[0].clientY - self.rect.y;
			},
			touchmove : function(e, touch){
				e.preventDefault();
				touch.moveX = e.touches[0].clientX - self.rect.x;
				touch.moveY = e.touches[0].clientY - self.rect.y;
			},
			touchend : function(e, touch){
				touch.moveX = touch.moveY = 0;
				self.opts.touchend(self);
			}
		});
		var w = (this.opts.width || document.documentElement.clientWidth)* this.devicePixelRatio,
			h = (this.opts.height || document.documentElement.clientHeight) * this.devicePixelRatio;
		this.width = this.height = this.canvas.width = this.canvas.height = Math.min(w,h);
		container.style.width = '100%';
		this.setPoints();
		this.drawAllRound(this.ctx);
	};
	DrawGesture.prototype = {
		init : function(){
			var rect = this.canvas.getBoundingClientRect();
			this.rect.x = rect.left;
			this.rect.y = rect.top;
			this.touch.init();
		},
		setPoints : function(){
			var w = this.canvas.width,
				h = this.canvas.height,
				radius = w / (3 * 2 * 2)  | 1,
				i=0, j=0, index = 0;
			for(; i<3; i++, j=0){
				for(; j<3; j++){
					this.rounds.push({
						x : (w / 6 + w / 3 * j) | 1,
						y : (h / 6 + h / 3 * i) | 1,
						radius : radius
					});
				}
			}
		},
		containsPoint : function(rect, x, y){
			// 圆坐标, touchx, touchy
			var radius = rect.radius;
			x *= this.devicePixelRatio;
			y *= this.devicePixelRatio;
			return rect.x + radius > x && rect.x - radius < x && rect.y + radius > y && rect.y - radius < y;
		},
		draw : function(){
			var round = null,
				x = this.touch.moveX,
				y = this.touch.moveY;
			if(x && y){
				for(var i=0, l=this.rounds.length; i<l; i++){
					round = this.rounds[i];
					if(this.matrixs[i] === 0 && this.containsPoint(round, x, y)){
						this.orders.push(i);
						this.matrixs[i] = 1;
						this.opts.chooseFn(this, i);
					}
				}
			}
			this.drawLine(this.ctx);
			this.drawAllRound(this.ctx);
		},
		drawLine : function(ctx){
			var round = null,
				devicePixelRatio = this.devicePixelRatio;
			this.ctx.beginPath();
			// this.ctx.strokeStyle = this.opts[this.statuscolor];
			switch(this.status){
				case 0 : ctx.strokeStyle = this.opts.unchosecolor; break;
				case 2 : ctx.strokeStyle = this.opts.successcolor; break;
				case 3 : ctx.strokeStyle = this.opts.errorcolor; break;
				default : ctx.strokeStyle = this.opts.unchosecolor;
			}
			ctx.lineWidth = devicePixelRatio;
			for(var i=0, l=this.orders.length; i<l; i++){
				round = this.rounds[this.orders[i]];
				if(i === 0){
					ctx.moveTo(round.x, round.y);
				}
				else{
					ctx.lineTo(round.x, round.y);
				}
			}
			if(this.touch.draging && this.orders.length != 0){
				ctx.lineTo(this.touch.moveX * devicePixelRatio, this.touch.moveY * devicePixelRatio);
			}
			ctx.stroke();
		},
		drawAllRound : function(ctx){
			var i=0;
			while(i < 9){
				this.matrixs[i] === 0 ?
					this.drawUnChooseRound(ctx, this.rounds[i]) :
					this.drawChoseRound(ctx, this.rounds[i]);
				i++;
			}
		},
		drawUnChooseRound : function(ctx, round){
			//未选中的圆
			var x = round.x,
				y = round.y,
				r = round.radius,
				pi = 2*Math.PI;
			ctx.save();
			ctx.beginPath();
			ctx.strokeStyle = this.opts.unchosecolor;
			ctx.lineWidth = this.devicePixelRatio*2;
			ctx.arc(x, y, r, 0, pi);
			ctx.stroke();
			ctx.restore();
		},
		drawChoseRound : function(ctx, round){
			//选中的圆
			var x = round.x,
				y = round.y,
				r = round.radius,
				pi = 2*Math.PI,
				status = this.status;
			ctx.save();
			switch(status){
				//选中的样式
				case 1 : ctx.strokeStyle = this.opts.chosecolor; break; //正确的样式
				case 2 : ctx.strokeStyle = this.opts.successcolor; break; //错误的样式
				case 3 : ctx.strokeStyle = this.opts.errorcolor; break;
				default : ctx.strokeStyle = this.opts.chosecolor;
			}
			ctx.lineWidth = this.devicePixelRatio*2;
			ctx.beginPath();
			ctx.arc(x, y, r, 0, pi);
			// ctx.fillStyle = '#fff'
			// ctx.fill();
			ctx.stroke();
			this.drawInnerRound(ctx,x,y,r,pi)
			ctx.restore();
		},
		drawInnerRound : function(ctx,x,y,r,pi){
			//内圆, 优先使用配置参数的方法
			if(this.opts.drawInnerRound){
				this.opts.drawInnerRound(this,ctx,x,y,r,pi);
				return;
			}
			
			//否则画圆环
			ctx.beginPath();
			ctx.arc(x, y, r/4, 0, pi);
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(x, y, r/3, 0, pi);
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(x, y, r/2, 0, pi);
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(x, y, r/1.5, 0, pi);
			ctx.stroke();
		},
		clear : function(){
			this.matrixs = [0,0,0,0,0,0,0,0,0];
			this.orders = [];
			this.status = 0;
		},
		errorStatus : function(){
			this.status = 3;
		},
		successStatus : function(){
			this.status = 2;
		},
		destroy : function(){
			this.touch.off();
		},
	};
	return DrawGesture;
});
