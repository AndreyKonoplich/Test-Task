document.addEventListener('DOMContentLoaded', function() {
    const divs = document.querySelectorAll('.currencyByDate, .dynamicCurrency, .converter');
    const screens = document.querySelectorAll('.newScreen');

    function showScreen(screenId) {
        screens.forEach(screen => {
            screen.classList.remove('active');
        });

        const screenToShow = document.getElementById(screenId);
        if (screenToShow) {
            screenToShow.classList.add('active');
            updateHistory(screenId);
        }
    }

    function updateHistory(screenId) {
        const url = `#${screenId}`;
        history.pushState({ screen: screenId }, "", url);
    }

    divs.forEach(div => {
        div.addEventListener('click', function() {
            const target = div.getAttribute('data-target');
            showScreen(target);
        });
    });

    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.screen) {
            showScreen(event.state.screen);
        } else {
            screens.forEach(screen => screen.classList.remove('active'));
        }
    });
});
