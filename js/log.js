log = {
    init: function() {
        this.logControl = $('#log');
        this.logControl.val('');
    },
    info: function(message) {
        this.logControl.val(
            this.logControl.val() + message + "\n"
        );
        this.logControl.scrollTop(this.logControl[0].scrollHeight);
    }
};