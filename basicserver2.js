const http = require('http');
var CORS = require('cors')();
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(CORS);
app.use(express.json());
const BigQuery = require('@google-cloud/bigquery');
const projectId = 'gcp-hackathon18-icn-2904';
const bigquery = new BigQuery({
    projectId: projectId,
    keyFilename: './GCP Hackathon Korea 2904-045b0816f2d8.json'
  });
const util = require('util');
var globalStr;
var server = app.listen(3000, function(){    
    console.log("Express server has started on port 3000")
});

//메인 페이지에서 팀 이름들 다 보내주기
app.get('/',function(req,res){
    getTeamListMain().then(
        function(value){
        res.writeHead(200,{'Content-Type' : 'application/json'/*'text/plain'*/});            
        var str = "["+ globalStr;
        str = str.substring(0, str.length - 1);
        str += "]";
        console.log(globalStr);
        console.log(typeof(globalStr));
        res.end(str); 
        }
    );
});
function getTeamListMain(){
    return new Promise(function(resolve,reject){
        var list = "";
        var query = 'SELECT name, turner_name FROM [bigquery-public-data:ncaa_basketball.mbb_teams] ORDER BY name';
        bigquery.createQueryStream(query)
        .on('error',console.error)
        .on('data',function(row){
            list+=JSON.stringify(row);
            list+=',';
        })
        .on('end',function(){
            globalStr=list;
            if(list){
                resolve(list);
            }
            else{
                reject('error');
            }        
        });
    });
}

//팀별 승률과 로고 보여주기
app.get('/winningRate/:marketName',function(req,res){
    var market = req.params.marketName;
    market=market.replace("_", " ");
    teamWinningRate(market).then(teamLogo).then(    
        function(value){
            console.log(" value : ", value);
        var result = {
            winningRate : value
        }
        res.writeHead(200,{'Content-Type' : 'application/json'});            
        res.end(JSON.stringify(result));},
        function(value){
            //promise error
        }
    );
});
function teamWinningRate(param){//param rate is tuner_name
    return new Promise(function(resolve,reject){
        var Rate="";
        var query = 'SELECT market, name, wins, losses FROM [bigquery-public-data:ncaa_basketball.mbb_historical_teams_seasons] where season = 2015 and name is NOT NULL and market is NOT NULL and market = '+'\''+param+'\'';
        bigquery.createQueryStream(query)
        .on('error',console.error)
        .on('data',function(row){
            Rate +=util.inspect(row);
        })
        .on('end',function(){
            if(Rate){
                resolve(Rate);
            }
            else{
                reject('error');
            }        
        });
    });
}
function teamLogo(param){ //this param would be json
    return new Promise(function(resolve,reject){
        var url="";
        var query = 'SELECT logo_large FROM [bigquery-public-data:ncaa_basketball.mbb_teams] LIMIT 5'; 
        bigquery.createQueryStream(query)
        .on('error',console.error)
        .on('data',function(row){
            console.log("here");
            console.log(row);
            url = JSON.stringify(row);            
        })
        .on('end',function(){
            if(url){
                resolve(url);
            }
            else{
                reject('error');
            }
        });
    });
}

//return team name
app.post('/list',function(req,res){
    var json = req.body;
    var alphabet = util.inspect(json.alphabet);    
    teamNameList(alphabet).then(result=>{
        var json = {
            teamNameList : result
        }
        res.writeHead(200,{'Content-Type' : 'application/json'});
        res.end(JSON.stringify(result));},
        function(value){
            //promise error
        }
    );
});
function teamNameList(param){
    return new Promise(function(resolve,reject){
        var list="";
        var query = 'SELECT name, turner_name FROM [bigquery-public-data:ncaa_basketball.mbb_teams] where name is NOT NULL and name LIKE ' +param;
        console.log(query);
        bigquery.createQueryStream(query)
        .on('error',console.error)
        .on('data',function(row){
            list +=util.inspect(row);
        })
        .on('end',function(){
            console.log(list);
            if(list){
                resolve(list);
            }
            else{
                reject('error');
            }        
        });
    });
}