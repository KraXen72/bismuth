if (!window.EyeDropper) {
    document.body.innerHTML = 'Oops, not supported, try to update Chrome to version 95 or upper.';
} else {
    const $getColorBtn = document.getElementById('get-color-btn');
    const getColor = () => {
        const eyeDropper = new EyeDropper();

        eyeDropper
            .open()
            .then(result => {
                navigator.clipboard.writeText(result.sRGBHex);
            })
            .catch(error => {});
    };

    $getColorBtn.addEventListener('click', getColor);
}
