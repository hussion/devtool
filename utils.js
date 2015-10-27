exports.debounce = function(fn, wait) {
	var timer;
	return function() {
		var self = this, args = arguments;
		clearTimeout(timer);
		timer = setTimeout(function() {
			fn.apply(self, args);
		}, wait);
	}
};

exports.contains = function(array, val) {
    for (var i = 0, len = array.length; i < len; i++) {
        if (array[i] == val) {
            return true;
            break;
        }
    }
    return false;
}
