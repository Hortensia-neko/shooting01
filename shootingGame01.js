// phina.js をグローバル領域に展開
phina.globalize();
const SCREEN_WIDTH=504;
const SCREEN_HEIGHT=896;
const PLAYER_SPEED=10;
const TIMELIMIT=60;
var mySceneList=[
    {
        className:"TitleScene",
        label:"titleScene",
        nextLabel:"introductionScene",
    },
    {
        className:"IntroductionScene",
        label:"introductionScene",
        nextLabel:"mainScene",
    },
    {
        className:"MainScene",
        label:"mainScene",
        nextLabel:"resultScene",
    },
    {
        className:"ResultScene",
        label:"resultScene",
        nextLabel:"titleScene",
    }

]

// MainScene クラスを定義
phina.define('MainScene', {
  superClass: 'DisplayScene',
  init: function() {
    this.superInit({
        width:SCREEN_WIDTH,
        height:SCREEN_HEIGHT,
    });
    // 背景色を指定
    const self=this;
    this.backgroundColor = '#a9a9a9';
    this.playerGroup=DisplayElement().addChildTo(this);
    this.enemyGroup=DisplayElement().addChildTo(this);
    this.shotGroup=DisplayElement().addChildTo(this);
    this.enemyShotGroup=DisplayElement().addChildTo(this);
    this.time=TIMELIMIT;
    this.elaspedTime=0;
    this.player=Player(SCREEN_WIDTH/2,SCREEN_HEIGHT,this.shotGroup).addChildTo(this.playerGroup);
    this.scoreLabel=SuperLabel("SCORE:",130,15,10,30,"#ffffff").addChildTo(this);
    this.scoreLabel.setUp(this.player.score);
    this.timeLabel=SuperLabel("TIME:",400,15,2,30,"#ffffff").addChildTo(this);
    this.timeLabel.setUp(this.time);
},
  update:function(app){
      if(Math.randint(1,100)<10){
        Enemy(Math.randint(12,SCREEN_WIDTH-12),12,7,this.enemyShotGroup).addChildTo(this.enemyGroup);
      }
      this.collisionGroups(this.shotGroup,this.enemyGroup);
      this.collisionGroups(this.enemyGroup,this.playerGroup);
      this.collisionGroups(this.enemyShotGroup,this.playerGroup);
      this.elaspedTime+=app.deltaTime;
      this.time=TIMELIMIT-Math.floor(this.elaspedTime/1000);
      this.timeLabel.setUp(this.time);
      if(this.time<0){
        this.exit({score:this.player.score,});
      }
  },
  collisionGroups:(function(attacks,defences){
      attacks.children.some(function(attack){
        defences.children.some(function(defence){
            if(Collision.testRectRect(attack,defence)){
                attack.hit();
                defence.hit();


            }
        })
      })
  })
});

phina.define("SuperLabel",{
    superClass:"Label",
    init:function(prefix,x,y,length,fontSize,color){
        this.superInit({
            text:prefix+("0".repeat(length)),
            fontSize:fontSize,
            x:x,
            y:y,
            fill:color,
            stroke:false
        });
        this.prefix=prefix;
        this.length=length;
    },
    setUp:function(num){
        this.text=this.prefix+num.padding(this.length);
    }
});

phina.define("Player",{
    superClass:"RectangleShape",
    init:function(x,y,shotGroup){
        this.superInit();
        this.x=x;
        this.y=y;
        this.shotGroup=shotGroup;
        this.width=48;
        this.height=48;
        this.fill="#ff0fff";
        this.score=0;
        this.rowScore=100000;
    },
    update:function(app){
        let key=app.keyboard;
        if(key.getKey("left")){this.x-=PLAYER_SPEED}
        if(key.getKey("right")){this.x+=PLAYER_SPEED}
        if(key.getKey("up")){this.y-=PLAYER_SPEED}
        if(key.getKey("down")){this.y+=PLAYER_SPEED}
        if(this.x-this.width/2<0){this.x=this.width/2;}
        if(this.x+this.width/2>SCREEN_WIDTH){this.x=SCREEN_WIDTH-this.width/2;}
        if(this.y-this.height/2<0){this.y=this.height/2;}
        if(this.y+this.height/2>SCREEN_HEIGHT){this.y=SCREEN_HEIGHT-this.height/2;}
        if(key.getKey("z")){
            if(true){Shot(this.x,this.y,90).addChildTo(this.shotGroup);
            }else{
                //なんか条件つけて3ウェイモードとか入れてもいいかも
                Array.range(60,150,30).map(x=>Shot(this.x,this.y,x).addChildTo(this.shotGroup));
            }
        }
    },
    getScore:function(x,y){
        this.score+=(this.rowScore/Math.sqrt((this.x-x)**2+(this.y-y)**2)|0);
        this.parent.parent.scoreLabel.setUp(this.score);

    },
    hit:function(){
        this.score-=this.rowScore/100;
        this.parent.parent.scoreLabel.setUp(this.score);
    }
});

phina.define("Enemy",{
    superClass:"RectangleShape",
    init:function(x,y,speed,shotGroup){
        this.superInit();
        this.x=x;
        this.y=y;
        this.width=24;
        this.height=24;
        this.speed=speed;
        this.fill="#008000";
        this.stroke="#006400"
        this.shotGroup=shotGroup;

    },
    update:function(app){
        this.y+=this.speed;
        if(Math.randint(1,30)==30){
            if(Math.randint(1,2)==1){
                EnemyShot(this.x,this.y,Math.atan2(this.parent.parent.player.y-this.y,this.parent.parent.player.x-this.x)).addChildTo(this.shotGroup);
            }
        }
        if(this.y>SCREEN_HEIGHT){this.remove();}
    },
    hit:function(){
        this.remove();
    }
})

phina.define("Shot",{
    superClass:"RectangleShape",
    init:function(x,y,angle){
        this.superInit();
        this.x=x;
        this.y=y;
        this.angle=angle.toRadian();
        this.width=12;
        this.height=12;
        this.speed=36;
        this.vx=this.speed*Math.cos(this.angle);
        this.vy=this.speed*Math.sin(this.angle);
        this.fill="#ff0000"
    },
    update:function(app){
        this.x+=this.vx;
        this.y-=this.vy;
        if(this.x<0 || this.x>SCREEN_WIDTH || this.y<0 || this.y>SCREEN_HEIGHT){
            this.remove();
        }
    },
    hit:function(){
        this.parent.parent.player.getScore(this.x,this.y);
        this.remove();
    }
})
phina.define("EnemyShot",{
    superClass:"RectangleShape",
    init:function(x,y,angle){
        this.superInit();
        this.x=x;
        this.y=y;
        this.angle=angle;
        this.width=12;
        this.height=12;
        this.speed=8;
        this.vx=this.speed*Math.cos(this.angle);
        this.vy=this.speed*Math.sin(this.angle);
        this.fill="#00ff00"
        this.stroke="#32cd32"
    },
    update:function(app){
        this.x+=this.vx;
        this.y+=this.vy;
        //範囲内でグレイズ
        if(this.x>this.parent.parent.player.x-6||this.x<this.parent.parent.player.x+6||this.y>this.parent.parent.player.y-6||this.y<this.parent.parent.player.y+6){
            this.parent.parent.player.rowScore+=1000;
        }
        if(this.x<0 || this.x>SCREEN_WIDTH || this.y<0 || this.y>SCREEN_HEIGHT){
            this.remove();
        }
    },
    hit:function(){
        this.remove();
    }
})

phina.define("TitleScene",{
    superClass:"DisplayScene",
    init:function(){
        this.superInit();
        this.backgroundColor="#90ee90"
        this.titleLabel=Label({
            text:"上から降ってくる\n緑のやつを\nZキーを押すと出てくる\n弾で撃つゲーム",
            font:48,
        }).addChildTo(this).setPosition(250,200);
        this.startLabel=Label({
            text:"クリックでスタート",
            font:48,
        }).addChildTo(this).setPosition(250,700);
        this.setInteractive(true);

    },
    onpointend:function(){
        this.exit();
    }
})

phina.define("IntroductionScene",{
    superClass:"DisplayScene",
    init:function(){
        this.superInit();
        this.backgroundColor="#a9a9a9";
        this.introductionLabel=Label({
            text:"せつめい\nカーソルキーで移動\nZキーでショット\n被弾でスコアがマイナスされます\n制限時間内にたくさん撃とう！",
            font:48,
        }).addChildTo(this).setPosition(250,200);
        this.toNextLabel=Label({
            text:"クリックでスタート",
            font:48,
        }).addChildTo(this).setPosition(250,700);
    },
    onpointend:function(){
        this.exit();
    }
})

phina.define("ResultScene",{
    //メインからスコアを取得して表示するやつと、ツイートボタンを用意する
    superClass:"DisplayScene",
    init:function(param){
        this.superInit(param);
        this.backgroundColor="#90ee90";
        this.score=param.score;
        this.scoreLabel=Label({
            text:"スコア:",
            font:48,
        }).addChildTo(this).setPosition(250,300);
        this.scoreLabel.text+=this.score;
        this.shareButton=phina.ui.Button({
            text:"つぶやいてみる",
            fontsize:32,
            width:256,
            height:54,

        }).addChildTo(this).setPosition(this.gridX.center(),500);
        this.shareButton.setInteractive(true);
        this.shareButton.onpointend=function(){
            const text="上から降ってくる緑のやつをZキーを押すと出てくる弾で撃つゲームを遊んだよ。スコア:"+this.parent.score;
            const url=phina.social.Twitter.createURL({
                text:text,
                hashtags:"なんか撃つやつ",
            });
            const childrenWindow=window.open("about:blank");
            childrenWindow.location.href=url;
        };

    },
})

// メイン処理
phina.main(function() {
  // アプリケーション生成
  var app = GameApp({
    startLabel: 'titleScene', // タイトルから開始する
    fit:false,
    width:SCREEN_WIDTH,
    height:SCREEN_HEIGHT,
    scenes:[
        {
            className:"TitleScene",
            label:"titleScene",
            nextLabel:"introductionScene",
        },
        {
            className:"IntroductionScene",
            label:"introductionScene",
            nextLabel:"mainScene",
        },
        {
            className:"MainScene",
            label:"mainScene",
            nextLabel:"resultScene",
        },
        {
            className:"ResultScene",
            label:"resultScene",
            nextLabel:"titleScene",
        }
    
    ],
    });
  // アプリケーション実行
  app.run();
});
