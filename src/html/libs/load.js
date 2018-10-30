var elvtr = elvtr || {};

(function(){ //wrap
// Make sure js files load in the order specified:
elvtr.loadJS = function(arr){
  var L = arr.length, C = 0;
  var addscr = function(){
    var scrTag = document.createElement('script'), path = arr[C];
    scrTag.type = 'text/javascript';
    C++;
    (C<L) ? scrTag.onload = addscr :0;
    scrTag.src = path; 
    document.head.appendChild(scrTag);
  };
  addscr();
};
// Add specified css files:
elvtr.loadCSS = function(arr){
  for(var i=0; i<arr.length; i++){
    var cssTag = document.createElement('link');
    cssTag.href = arr[i]; cssTag.rel = 'stylesheet'; cssTag.type = 'text/css';
    document.head.appendChild(cssTag);
  }
};

})(); //wrap
