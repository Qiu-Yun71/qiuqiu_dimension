//主题切换(加上本地存储实现刷新后主题也不改变)
const themechange = document.getElementById('dark');
const nowtheme = localStorage.getItem('theme');


if (nowtheme === 'dark') {
    document.body.classList.add('dark')
}

themechange.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const current = document.body.classList.contains('dark') ? 'dark' : 'light'
    localStorage.setItem('theme', 'current')

})