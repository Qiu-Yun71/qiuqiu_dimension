//第一部分：主题切换(加上本地存储实现刷新后主题也不改变)
const themechange = document.getElementById('dark');
const nowtheme = localStorage.getItem('theme');


if (nowtheme === 'dark') {
    document.body.classList.add('dark')
}

themechange.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const current = document.body.classList.contains('dark') ? 'dark' : 'light'
    localStorage.setItem('theme', current)

})


//第二部分：api请求和卡片渲染
const cardContainer = document.querySelector('.cards')

//加一个显示加载中的元素
const loading = document.createElement('div')
loading.className = 'loading'  //设置类名便于添加css样式
loading.textContent = '加载中......'

async function fetchAnime() {
    cardContainer.innerHTML = '';//清空原有内容
    cardContainer.appendChild(loading)//显示加载中
    try {
        const response = await fetch('https://api.bgm.tv/calendar')
        if (!response.ok) {
            throw new Error('网络错误')
        }
        const data = await response.json()

        //api返回的结果用星期分类了，这里需要聚合一下
        let allItems = [];
        data.forEach(day => {
            if (day.items && Array.isArray(day.items)) {
                allItems = [...allItems, ...day.items]
            }

        });

        //排除掉没有封面的动漫信息，取前二十条
        const animeList = allItems.filter(item => item.images && item.images.large).slice(0, 20)
        if (animeList.length === 0) {
            cardContainer.innerHTML = '<p>暂无内容</p>'
            return
        }

        //进行渲染
        renderCards(animeList);

    } catch (error) {
        console.error('获取失败', error)
        cardContainer.innerHTML = '<p>数据加载失败，请检查网络后刷新重试。</p>'
    }


}
//动漫标题名字个数改变字体显示大小
function getFontSize(title) {
    const length = title.length;
    if (length <= 4) return '1.8rem';
    if (length <= 8) return '1.4rem';
    if (length <= 12) return '1.3rem';
    return '1.2rem';
}

function renderCards(animeList) {
    const html = animeList.map(anime => {
        const picture = anime.images.large
        const title = anime.name_cn || anime.name
        const fontSize = getFontSize(title);

        return `<div class="card">
            <img src="${picture}" alt="${title}">
            <div class="card-content">
                <h3 style="font-size: ${fontSize};">${title}</h3>
            </div>
         </div>`

    }).join('')

    cardContainer.innerHTML = html;
}

fetchAnime()

//三·搜索功能（防抖）
const searchInput = document.getElementById('search')

//防抖
let currenttime
searchInput.addEventListener('input', (e) => {
    const keyword = e.target.value.trim();
    if (currenttime) {
        clearTimeout(currenttime)
    }
    currenttime = setTimeout(() => {
        if (keyword === '') {
            fetchAnime()
        } else {
            searchAnime(keyword)
        }

    }, 1000)
})






