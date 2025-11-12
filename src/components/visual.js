export const getRandomColor = () => {
    const colors = ['#FF7043', '#29B6F6', '#66BB6A', '#AB47BC', '#FFA726', '#EC407A'];
    console.log('Gerando cor');
    return colors[Math.floor(Math.random()*colors.length)];
};