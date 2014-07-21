﻿package  {	import flash.display.Sprite;	import flash.display.Shape;	import flash.display.Graphics;	import flash.geom.*;	import flash.events.*;	import flash.display.BitmapData;	import flash.utils.getTimer;		public class Renderable extends Sprite {				//a pointer to the main class for accessing certain		//things easier/faster		var par:Main;				//these three variables store the ID's of the  renderables		//texture, geometry, and transform		var texID:String;		var geomId:String;		var tranId:String;				//these three variables hold the geometry,transform, and		//texture themselves as accessing them using the ids every		//time can be to slow		var geom:Geometry;		var tran:Matrix3D		var texture:BitmapData;						//if created using createTexturedGridRenderable this is set		//to true, otherwise it is false.  If it is true when the		//renderable is deleted it's texture, geometry, and transform		//are also deleted		//loadWidthandHeight,subdivX, and subdivY are all used when		//-1,-1 are passed in for width and height signalling that the		//geometry should be created with the textures width and height		//when it loads		var simpleCreation:Boolean = false;		var loadWidthandHeight:Boolean =false;		var subdivX:int = 1;		var subdivY:int = 1;				//used by the sorting function if orderSort option is turned		//on, otherwise not used		public var order:int = 0;				//these two are set by animateGridRenderable when an animation		//is started.  		var animationFinished:Boolean = true;		var startAnimation:Boolean = false;				//these will hold vectors for the texture data (which will have		//it's t values filled in) and also the 2d points which are		//the results of multiplying out our 3d vertex's		var uvtData:Vector.<Number>;		var toDraw:Vector.<Number>;		var indices:Vector.<int>;				//g holds the graphics onto which the renderable will draw		//iself, usually this is the parent container sprite but		//when alpha or color animations are used an alphaSprite is		//created and added to the parent and it's graphics is used		//instead		var g:Graphics;		var alphaSprite:Sprite=null;				//this colorTransform is used whenever the renderable is 		//animated with a change of color		var cTransform:ColorTransform = new ColorTransform();				//is set to true as soon as the renderables texture loads		//when this is true and render is called any animation that has		//been waiting to start will use this frame as it's first frame and		//begin animation		var justLoaded:Boolean = false;		public function Renderable(p:Main,ageom:String,t:String,atexID:String) {			//setup our various variables			par = p;			g = par.container.graphics;			texID = atexID;			geomId=ageom;			tranId=t;						//get the transform's and geometry's from their ids.  We			//check in createRenderable that these are valid ids but			//there is another check done here just in case			tran = p.tran[t];			geom = p.geom[ageom];			if(!tran)p.errorString = "error creating Renderable invalid transformID";			if(!geom)p.errorString = "error creating Renderable invalid geometryID";						//if the renderables texture isn't fetched yet we want to check			//for it every frame until it is fetched.  If it is already			//fetched we just load it now.			if(par.isTextureFetched(texID)) textureLoaded();						//current properties holds the renderables current animation data			//we have to fill it with the defaults so that the renderable			//starts out in the correct state.			currentProperties.x=0;			currentProperties.y=0;			currentProperties.z=0;			currentProperties.opacity=1;			currentProperties.green=1;			currentProperties.red=1;			currentProperties.blue=1;			currentProperties.rotate=0;									//the uvt data needs 3 numbers per vertex (u, v, and t)			//where the texcoords only needs 2 (u and v) so make			//uvtData the correct length			uvtData = new Vector.<Number>(geom.texcoords.length/2*3);						//fill uvt data with the correct u and v and fill the			//t slot with a nonsense number (999) that will be			//overridden the first time through			for(var i:int = 0;i<geom.texcoords.length/2;i++){				uvtData[i*3]=geom.texcoords[i*2];				uvtData[i*3+1]=geom.texcoords[i*2+1];				uvtData[i*3+2]=999;			}			 			//toDraw needs 2 numbers (x and y) for every vertex			//but geom.vertices needs 3 number per vertex (x,y, and z)			//this makes toDraw the correct size based on the number of			//vertices in geom.vertices			toDraw = new Vector.<Number>(geom.vertices.length/3*2);			indices = new Vector.<int>(geom.indices.length);		}				//when a renderable is deleted we need to do some cleaning up		//this function is called to do the cleaning when deleteRendeable		//is called		function clean(){			//if we have an alpha sprite we are drawing for we need to remove			//it from the parent so it no longer gets drawn			if(alphaSprite)par.removeChild(alphaSprite);						//if the renderble was created using simpleCreation then we need			//to delete all it's components as well, so we null them out, and			//dispose of the texture			if(simpleCreation){				if(texture)texture.dispose();				par.tex[texID]=null;				par.geom[geomId]=null;				par.tran[tranId]=null;							}		}								//a temporary transform that is used for doing the multiplication		//of our animation/transform/and camera transform allocated now		//as a global for speed reasons		var tempTran:Matrix3D = new Matrix3D();		public function draw(){				//if there is no texture yet check it to see if it's			//arived if it hasn't then don't draw			if(!texture)checkTexture();			if(!texture) return;						//if we are drawing to the alphaSprite instead of the container			//then we need to clear the alphaSprite. we don't clear the container			//because that is just done once in render in Main.as			if(alphaSprite)g.clear();						//set the temporary transform equal to the transform*animation			tempTran = animate();			tempTran.append(tran);						//multiply that by the camera			tempTran.append(par.cam);						//if any of the colors need to be changed the setup the			//ctransform filter so that it has the correct values			if(currentProperties.red!=1 || currentProperties.blue!=1 || currentProperties.green!=1){				cTransform.greenMultiplier = currentProperties.green;				cTransform.redMultiplier = currentProperties.red;				cTransform.blueMultiplier = currentProperties.blue;								//apply the colorTransform filter to the alphaSprite that				//we draw to				alphaSprite.transform.colorTransform = cTransform;			}						//FP11 this line would be changed to a Stage3D call in FP11			//take the temporary transform which is now animation*transform*camera			//and use it to transform the vertices.  Then convert from 3D space			//to 2D space.  Put the resulting 2D data into toDraw and fill the t			//values of uvtData with the correct numbers			Utils3D.projectVectors(tempTran, geom.vertices, toDraw, uvtData);						//if no vertices are in front of the camera don't draw it			var behindCamera:Boolean = true;			var intersects:Boolean = false;			for(var i:int = 0;i<uvtData.length/3;i++){				if(uvtData[i*3+2]<=0){					intersects=true;										//comment this in if you wish to use a 					//fix for image culling which causes some					//texture distortions					/*					//this vertex is behind the camera so fix it					var temp:Vector3D = fixVertex(i,tempTran);					//set the uvt and toDraw data to match					//our fixed vertex					uvtData[i*3+2]=1/temp.w;					toDraw[i*2]=temp.x;					toDraw[i*2+1]=temp.y;					*/									}else behindCamera=false;			}						//if it is behind the camera stop drawing now			if(behindCamera)return;						//comment this section out if you wish to use the 			//if the renderable intersects then loop through			//the indices and don't draw any triangle which			//has one or more indices behind the camera			if(intersects){				for(i =0;i<geom.indices.length/3;i++){					var vertex1:int = geom.indices[i*3];					var vertex2:int = geom.indices[i*3+1];					var vertex3:int = geom.indices[i*3+2];					if(uvtData[vertex1*3+2]<=0 || uvtData[vertex2*3+2]<=0 || uvtData[vertex3*3+2]<=0){						indices[i*3]=0;						indices[i*3+1]=0;						indices[i*3+2]=0;						}else{						indices[i*3]=geom.indices[i*3];						indices[i*3+1]=geom.indices[i*3+1];						indices[i*3+2]=geom.indices[i*3+2];					}				}			}															//uncomenting this out will cause orderSort to sort			//by the distance from the camera instead of by			//there order values		/*			for(var i:int=0;i<uvtData.length/3;i++){				order+=uvtData[i*3+2];			}			order = order/Math.floor(uvtData.length/3);			*/						//convert our opengl style coordinates into screen			//coordinates			convertToScreen(toDraw);												//FP11 these two lines would be changed to call on Stage3D			//if converting to flash 11 hardware mode						//set our texture to be the current texture, we don't			//want to apply a transform to it (null) and we don't			//want it to repeat (false).  if antialias is set to			//true then we want it to antialias otherwise not			if(texture is BitmapData)g.beginBitmapFill(texture,null,false,par.antialias);			//draw the renderable			if(intersects)g.drawTriangles(toDraw,indices,uvtData,par.cullingOption);			else g.drawTriangles(toDraw,geom.indices,uvtData,par.cullingOption);		}				//a variable prealocated here for speed used in fixing the vertex		var vertexToFix = new Vector3D();		function fixVertex(vertexNum:int,transform:Matrix3D):Vector3D{			//set vertex fix to be the vertex that needs fixing			vertexToFix.x = geom.vertices[vertexNum*3];			vertexToFix.y = geom.vertices[vertexNum*3+1];			vertexToFix.z = geom.vertices[vertexNum*3+2];			//transform the vertex but don't perform the 3D->2D calculation			var toDraw:Vector3D = transform.transformVector(vertexToFix);			//the w here should be <0 but that causes errors so			//we set it to something small, because this vertex is offscreen			//though (otherwise it's w would be >=0) the slight distortion isn't			//visible			toDraw.w=0.01;			toDraw = par.normalize(toDraw);			//normalizing the vector by w means w=1 now but we want			//to use it as a 1/t value later so set it back to be			//our "guessed" w			//toDraw.w=0.01						//return the vertex			return toDraw;		}						//these three objects hold the end of the animation properties		//the begining properties and the current properties		//current always contains all possible properties while end		//and begining do not neccesarily have any		var endProperties:Object = new Object;		var beginProperties:Object = new Object;		var currentProperties:Object = new Object;		//the duration of the animation in seconds		var duration:Number = 1;		//animate animates opacity,color,x,y,z, and rotation		//rotate animates about the middle of each renderable		//NOTE: x,y, and z values should be in the same scale as		//the models model transformation.  For example if x and y		//are each scaled by 0.5 in the model transformation matrix		//any translation in x and y will also be scaled by 0.5		function animate():Matrix3D{			//if animateRenderable has been called in between the			//last two renders then we need to start the animation			//this render			if(startAnimation){				//get the start time for the animation				start=par.currentTime;				//the animation has started now so we don't want to				//start it again so set startAnimation to false				//also the animation has started now so animation				//finished is false				startAnimation=false;				animationFinished=false;							}			//sets currentProperties values to be what they should be			//given  start,end,duration, and how much time has passed			tweenAnimation();						//if we don't have an alphaSprite and we need one for a property			//then create the alphaSprite			if(!alphaSprite && (currentProperties.opacity!=1 || currentProperties.red!=1 || currentProperties.blue!=1 || currentProperties.green!=1) )createAlphaSprite();						//FP11 switch these calls to be done with Stage3D			//set the temporaryTransform to be the indentity			//multiply all the current properties which			//effect the transform onto it (translation and rotation)			//before rotating we translate so that the center is at the origin			//then afterwards we translate back			tempTran.identity();			tempTran.appendTranslation(-geom.width/2,-geom.height/2,-geom.depth/2); 			tempTran.appendRotation(currentProperties.rotate,Vector3D.Z_AXIS);			tempTran.appendTranslation(geom.width/2,geom.height/2,geom.depth/2); 			tempTran.appendTranslation(currentProperties.x,currentProperties.y,currentProperties.z);									//if we have an alphaSprite set the alpha to be the			//correct opacity			if(alphaSprite)alphaSprite.alpha=currentProperties.opacity;						return tempTran;		}				//creates an alpha sprite and sets it up so that		//rendering is done to the alpha sprite instead of		//to the container		function createAlphaSprite(){			alphaSprite = new Sprite();			//add the alphaSprite to the parent's display list			//so that it gets drawn			par.addChild(alphaSprite);			//set the renderables g to the alphaSprites graphics			//instead of the containers graphics so that the renderable			//is now drawn to the alphaSprite instead of the container			g=alphaSprite.graphics;		}				//holds the type of easing to use and the start value		//of when the animation started		var easing:String = "linear";		var start:Number = 0;		function tweenAnimation(){			//if the texture has just been loaded set the start time for te animation			//to be the current Time			if(justLoaded){start = par.currentTime; justLoaded=false;}			//set t to a value between 0 and 1 for the percentage of the duration			//which has been used up already			var t = (par.currentTime-start)/(1000*duration);			//if we don't have a texture yet then don't start animating			//yet			if( !(texture is BitmapData))t = 0;			if(t>=1){				//if t is greater then or equal to 1 then set it to 1				//and the animation is finished				t=1;				animationFinished=true;			}						//for every property in beginProperties set currentProperties			//of that property equal to the correct value			for (var i:* in beginProperties){				//make sure endProperties has the property as well				if(!endProperties.hasOwnProperty(i))continue;				currentProperties[i] = beginProperties[i]+mapT(easingFuncTables[easing],t)*(endProperties[i]-beginProperties[i]);			}		}				//uses the tables created at initialisation to take		//a t from 0-1 and return a tweened value from 0-1 also		function mapT(table, t):Number {			var tt = t * (easingFuncTableSize-1);			var t0 = Math.floor(tt), 			t1 = t0>=easingFuncTableSize-1 ? t0 : t0+1,			alpha = tt-t0;			return (1-alpha)*table[t0] + alpha*table[t1]; 		}				//these variables are used for creating and storing the 		//easing functions into tables		static var easingFunc;		static var easingFuncTables;		static var easingFuncTableSize;		static function init(){			easingFunc = {};			easingFuncTables = {};			//this is the accuracy of the tabales			easingFuncTableSize = 64;			//these are all the easing modes available			var easingModes = ["ease", "linear", "ease-in", "ease-out", "ease-in-out"];			var x1, y1, x2, y2;			for (var mode=0; mode<easingModes.length; mode++) {				switch (easingModes[mode]) {					case "ease":						x1 = 0.25; y1 = 0.10; x2 = 0.25; y2 = 1.00;						break;					case "linear":						x1 = 0.00; y1 = 0.00; x2 = 1.00; y2 = 1.00;						break;					case "ease-in":						x1 = 0.42; y1 = 0.00; x2 = 1.00; y2 = 1.00;						break;					case "ease-out":						x1 = 0.00; y1 = 0.00; x2 = 0.58; y2 = 1.00;						break;					case "ease-in-out":						x1 = 0.42; y1 = 0.00; x2 = 0.58; y2 = 1.00;						break;				}				easingFunc[easingModes[mode]] = bezier(x1,y1,x2,y2);						var table = new Array(64);				for (var i=0; i<easingFuncTableSize; i++)					table[i] = easingFunc[easingModes[mode]](							i/(easingFuncTableSize-1));				easingFuncTables[easingModes[mode]] = table;			}					}		static function bezier(x1, y1, x2, y2) {			// Cubic bezier with control points (0, 0), (x1, y1), (x2, y2), and (1, 1).			function x_for_t(t) {				var omt = 1-t;				return 3 * omt * omt * t * x1 + 3 * omt * t * t * x2 + t * t * t;			}			function y_for_t(t) {				var omt = 1-t;				return 3 * omt * omt * t * y1 + 3 * omt * t * t * y2 + t * t * t;			}			function t_for_x(x) {				// Binary subdivision.				var mint = 0, maxt = 1;				for (var i = 0; i < 30; ++i) {					var guesst = (mint + maxt) / 2;					var guessx = x_for_t(guesst);					if (x < guessx)						maxt = guesst;					else						mint = guesst;				}				return (mint + maxt) / 2;			}			return function bezier_closure(x) {				if (x == 0) return 0;				if (x == 1) return 1;				return y_for_t(t_for_x(x));			}					}						//before the texture is loaded this function checks to see if		//it has been loaded each frame.		function checkTexture(){			if(par.isTextureFetched(texID)){				//set up the texture now that the texture is loaded				textureLoaded();			}		}				//set's up the texture, this also sometimes meens setting the		//width and the height of the object to be the textures width		//and height		function textureLoaded(){			//grab the texture from it's table			texture = par.tex[texID];						//if it' uses -1,-1 for it's width and height we need to 			//set it's with and height to the textures width and height			if(loadWidthandHeight){				var tempWidth = texture.width/subdivX;				var tempHeight = texture.height/subdivY;				//these are all used for creating a geometry				var vertex:Array = new Array();				var uvt:Array = new Array();				var indices:Array = new Array();				//edit the geometry so that it now uses width and height instead of -1				for(var i:int=0;i<subdivX;i++){					for(var j:int = 0;j<subdivY;j++){						var minX:Number = tempWidth*(i);						var maxX:Number = tempWidth*(i+1);						var minY:Number = tempHeight*(j);						var maxY:Number = tempHeight*(j+1);						//push vertex's for this subdivision						vertex.push(minX,minY,0, maxX,minY,0, minX,maxY,0, maxX,maxY,0);						var count:int = (i*subdivY)+j;						//push indices for this subdivision						indices.push(0+count*4,1+count*4,2+count*4, 1+count*4,3+count*4,2+count*4);						minX = 1/subdivX*i;						maxX = 1/subdivX*(i+1);						minY = 1/subdivY*j;						maxY = 1/subdivY*(j+1);						//push uvt data for this subdivision						uvt.push(minX,minY, maxX,minY, minX,maxY, maxX,maxY);					}				}				par.deleteGeometry(geomId);				geomId = par.createGeometry(vertex,uvt,indices,0);				geom = par.geom[geomId];				for(i = 0;i<geom.texcoords.length/2;i++){					uvtData[i*3]=geom.texcoords[i*2];					uvtData[i*3+1]=geom.texcoords[i*2+1];					uvtData[i*3+2]=999;				}				//geom.vertices = Vector.<Number>([0,0,0, width,0,0, 0,height,0, width,height,0]);			}			//we just loaded the texture so set this to true so			//that animations will start on the next render			justLoaded=true;		}						//take a vector of numbers and change all of their x and y		//values from opengl coordinates to screen coordinates		//opengl goes from -1,-1 (bottom left) to 1,1 (upper right)		//screen goes from 0,0 (upper left) to 6,6 (bottom right)		function convertToScreen(a:Vector.<Number>){			for(var i:int = 0;i<a.length/2;i++){				//to change the x value add 1 to it so that it goes				//from 0 to 2 and then multiply by 300 so it goes				//from 0 to 600				a[i*2] = (a[i*2]+1)*300; 				//for the y value we invert it first and then do				//the same transformation we did for the x value				a[i*2+1] = ((a[i*2+1]*-1)+1)*300;			}		}	}	}