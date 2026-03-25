document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('searchForm');
    const fromDate = document.getElementById('fromDate');
    const toDate = document.getElementById('toDate');

    // Set max date to today
    const today = new Date().toISOString().split('T')[0];
    fromDate.max = today;
    toDate.max = today;

    // Validate date range
    fromDate.addEventListener('change', function() {
        toDate.min = this.value;
    });

    toDate.addEventListener('change', function() {
        fromDate.max = this.value;
    });

    // Form validation
    form.addEventListener('submit', function(e) {
        const department = document.getElementById('department').value;
        
        if (!department) {
            e.preventDefault();
            alert('Please select a department');
            return;
        }
    });
});
