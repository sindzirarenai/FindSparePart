log = require ('../lib/log')(module);
request = require('request');
cheerio = require('cheerio');
config = require('../config');
async = require('async');
date = require('../lib/date');
regexp = require('./regexp/razborka');

function getElementInfo(item, callback){
request(item, function(err,resp,body){
  if(err||resp.statusCode!=200){callback(err+' '+resp,null); return false;}
  else{
  console.log(item);
      var elementInfo = regexp(body);
      var obj ={
        name:elementInfo.name,
        section:elementInfo.section,
        model:elementInfo.model,
        marka:elementInfo.marka,
        about:elementInfo.about,
        reference:item,
        code:elementInfo.code,
        site:config.get("parsers")[3].name,
        images:elementInfo.images,
        dateCreate:date.getDateInFormat(new Date()),
        price:elementInfo.price
      }; console.log(obj); callback(null, obj);
  }
}); 
return false; 
}

function getPageElements(item,callback){
request(item, function(err,resp, body){
    if(err||resp.statusCode!=200){callback(err+' '+resp,null); return false;}
    else{
    console.log(item);
      $=cheerio.load(body);
      var elements=[];
      $('#table_data').find('h3').each(function(i,elem){
        elements.push($(this).find('a').attr('href'));
      })
      async.mapSeries(elements, getElementInfo, callback); 
      return true;
    }   
  })
}

function getMarkaElements(item, callback){
request(item, function(err,resp, body){
  if(err||resp.statusCode!=200){callback(err+' '+resp,null); return false;}
  else{
  console.log(item);
    $=cheerio.load(body);
    var countPage = Math.floor(parseInt(/\d+/.exec($('.uc_spareshop_textdownform').text())[0])/20)+1;
    var pagesHref=[];
    for(var i=0; i<countPage; i++){
      pagesHref.push(item+'?page='+i);
    };
    async.map(pagesHref, getPageElements, callback);
    return true;
  }
})
return false;
}


function parse(callback){
  request(config.get("parsers")[3].url, function(err,resp, body){
    if(err||resp.statusCode!=200){callback(err+' '+resp,null); return false;}
    else{
      $=cheerio.load(body);
      var marksHref =[];
      $('.menu').find('li').each(function(i, elem){
        if(i>0){
          marksHref.push(config.get("parsers")[3].catalog+$(this).find('a').attr('href'));
        }
      });
      async.map(marksHref, getMarkaElements, callback);
      return true;
    }
  })
  return false;
}

module.exports = parse;