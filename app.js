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

let currentList = []//用于存储当前页面展示的卡片列表


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
        currentList = animeList
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
    const loves = getLove()
    const lovesId = loves.map(items => items.id)
    const html = animeList.map(anime => {
        const picture = anime.images.large
        const title = anime.name_cn || anime.name
        const fontSize = getFontSize(title);

        const islove = lovesId.includes(anime.id)

        //用自定义的data-id相较于id没有唯一性限制，用dataset读取
        return `<div class="card" data-id="${anime.id}">
            <div  class="love-btn ${islove ? "active" : ""} ">❤</div>
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

    }, 500)
})

async function searchAnime(keyword) {
    cardContainer.innerHTML = '';
    cardContainer.appendChild(loading);
    try {
        //这里要用反引号，因为是模板字符串
        const response = await fetch(`https://api.bgm.tv/search/subject/${keyword}?type=2`)
        if (!response.ok) throw new Error('搜索失败')
        const data = await response.json()
        let searchList = data.list || []
        searchList = searchList.filter(item => item.images && item.images.large).slice(0, 20)
        if (searchList.length === 0) {
            cardContainer.innerHTML = '<p>没有找到相关动漫，试试其他关键词吧～</p>';
            return;
        }
        currentList = searchList
        renderCards(searchList)

    } catch (error) {
        console.error('搜索出错', error);
        cardContainer.innerHTML = '<p>搜索失败，请检查网络后重试。</p>';

    }
}

//四、详情页
const modal = document.querySelector('.modal');
const modalBody = document.getElementById('modal-body');
const closeModalBtn = document.getElementById('close-modal');

async function openModal(animeId) {
    modal.style.display = 'flex'
    modalBody.innerHTML = '<div style="text-align: center">加载详情中.....</div>'
    try {
        const response = await fetch(`https://api.bgm.tv/v0/subjects/${animeId}`)
        if (!response.ok) {
            throw new Error('详情加载失败')
        }
        const data = await response.json()
        const title = data.name_cn || data.name;
        const originalName = data.name;
        const date = data.date || '未知';
        const summary = data.summary || '暂无简介';

        modalBody.innerHTML = `
            <h2>${title}</h2>
            <p><strong>原名：</strong> ${originalName}</p>
            <p><strong>开播日期：</strong> ${date}</p>
            <hr style="margin: 15px 0;">
            <p><strong>简介：</strong><br>${summary.replace(/\r\n\r\n/g, '<br>')}</p>
        `
        //注意浏览器不会识别\n，要替换成br

    } catch (error) {
        console.error('获取详情失败', error)
        modalBody.innerHTML = '<p style="color: red;">加载失败，请稍后重试</p>'
    }

}

function closeModal() {
    modal.style.display = 'none'//要有引号
}

cardContainer.addEventListener('click', (e) => {
    //先判断是否点击到收藏键
    const loveBtn = e.target.closest('.love-btn')
    if (loveBtn) {
        e.stopPropagation()//阻止冒泡到卡片详情
        const card = e.target.closest('.card')
        const animeId = parseInt(card.dataset.id)
        const animeData = currentList.find(item => item.id === animeId)
        if (animeId) {
            const added = toggleLove(animeId, animeData)
            // 使用强制转换代码健壮性更好
            loveBtn.classList.toggle('active', added)
        }
        return//不加会接着执行下面的详情页函数
    }

    const card = e.target.closest('.card')
    if (!card) return

    //card.dataset.animeId是字符串，要转换成数字
    const animeId = parseInt(card.dataset.id)
    if (animeId) openModal(animeId);
})

//注意监听器的函数没有括号，不然就是在绑定时直接执行监听器里的函数，而不是点击时执行
closeModalBtn.addEventListener('click', closeModal)
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
})


//五、排序
const sortSelect = document.getElementById('sort')

sortSelect.addEventListener('change', (e) => {
    const value = e.target.value
    if (!currentList.length) return

    let sorted = [...currentList]//不修改原数组，进行浅拷贝(直接相等是指向同一个数组) 之前currentList是直接赋值，指向的是当时的同一个数组
    if (value === 'score-sort') {
        //这里问号是判断score不存在的话是undefined，和0取或为0
        sorted.sort((a, b) => (b.rating?.score || 0) - (a.rating?.score || 0))
        renderCards(sorted)
    } else if (value === 'default') {
        renderCards(currentList);
        return;
    }
})

//五、收藏功能
//本地存储只能存储字符串形式
function getLove() {
    const stored = localStorage.getItem('loves')
    return stored ? JSON.parse(stored) : []
}

function saveLove(love) {
    localStorage.setItem('loves', JSON.stringify(love))
}

function showLoves() {
    const loves = getLove()
    const title = document.getElementById('title-text')
    title.innerHTML = '收藏列表'
    if (loves.length === 0) {
        cardContainer.innerHTML = '<b>暂无收藏喵，去添加一些叭~</b>'
        currentList = []
        return
    }
    currentList = loves
    renderCards(loves)

}

function toggleLove(animeId, animeData) {
    let loves = getLove()
    //判断其中一个属性值是否相等用some，find，不能用include，这个是全部的相等，更多判断某个对象是否存在
    const exict = loves.some(item => item.id === animeId)
    if (exict) {
        loves = loves.filter(item => item.id !== animeId)
    } else {
        loves.push(animeData)
    }
    saveLove(loves)
    return !exict
}

const loveBtn = document.getElementById('love')
loveBtn.addEventListener('click', showLoves)

//轮播图
const allSides = document.querySelector('.all-slides')
const slides = document.querySelectorAll('.slide')
const dots = document.querySelectorAll('.dot')
const prev = document.querySelector('.prev')
const next = document.querySelector('.next')


let currentIndex = 0
let timer = null

//更新轮播图位置和圆点样式
function updateSlides() {
    allSides.style.transform = `translateX(${-100 * currentIndex}%)`
    dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentIndex)
    })
    slides.forEach((slide, idx) => {
        slide.classList.toggle('active', idx === currentIndex)
    })
}

function nextSlide() {
    currentIndex = (currentIndex + 1) % slides.length
    updateSlides()
}
function prevSlide() {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length
    updateSlides()
}

//自动播放
function autoPlay() {
    if (timer) clearInterval(timer)//在存在定时器时，要清楚之前的重新创建一个，避免存在多个定时器
    timer = setInterval(nextSlide, 3000)
}
function stopAutoPlay() {
    if (timer) {
        clearInterval(timer)
        timer = null//关闭定时器后一定要手动清空id，前面的函数直接建立新定时器就不用
    }
}

prev.addEventListener('click', () => {
    stopAutoPlay()
    prevSlide()
    autoPlay()
})

next.addEventListener('click', () => {
    stopAutoPlay()
    nextSlide()
    autoPlay()
})

dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
        stopAutoPlay()
        currentIndex = idx
        updateSlides()
        autoPlay()
    })
})

//悬停时停止自动播放
const carousel = document.querySelector('.carousel')
carousel.addEventListener('mouseenter', stopAutoPlay)
carousel.addEventListener('mouseleave', autoPlay)

//初始化
updateSlides()
autoPlay()


