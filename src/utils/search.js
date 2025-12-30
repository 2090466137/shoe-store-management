// 智能搜索工具

/**
 * 拼音映射表（常用字）
 */
const pinyinMap = {
  '耐': 'nai',
  '克': 'ke',
  '阿': 'a',
  '迪': 'di',
  '达': 'da',
  '斯': 'si',
  '新': 'xin',
  '百': 'bai',
  '伦': 'lun',
  '匡': 'kuang',
  '威': 'wei',
  '李': 'li',
  '宁': 'ning',
  '安': 'an',
  '踏': 'ta',
  '特步': 'tebu',
  '鸿': 'hong',
  '星': 'xing',
  '尔': 'er',
  '乔': 'qiao',
  '丹': 'dan',
  '彪': 'biao',
  '马': 'ma',
  '回': 'hui',
  '力': 'li',
  '运': 'yun',
  '动': 'dong',
  '休': 'xiu',
  '闲': 'xian',
  '皮': 'pi',
  '鞋': 'xie',
  '帆': 'fan',
  '布': 'bu',
  '滑': 'hua',
  '板': 'ban',
  '凉': 'liang',
  '靴': 'xue',
  '子': 'zi',
  '黑': 'hei',
  '白': 'bai',
  '红': 'hong',
  '蓝': 'lan',
  '绿': 'lv',
  '黄': 'huang',
  '灰': 'hui',
  '粉': 'fen',
  '紫': 'zi',
  '橙': 'cheng',
  '棕': 'zong'
}

/**
 * 获取字符串的拼音首字母
 */
function getPinyinInitials(str) {
  if (!str) return ''
  
  let result = ''
  for (let char of str) {
    const pinyin = pinyinMap[char]
    if (pinyin) {
      result += pinyin[0].toLowerCase()
    } else if (/[a-zA-Z]/.test(char)) {
      result += char.toLowerCase()
    }
  }
  return result
}

/**
 * 获取字符串的完整拼音
 */
function getFullPinyin(str) {
  if (!str) return ''
  
  let result = ''
  for (let char of str) {
    const pinyin = pinyinMap[char]
    if (pinyin) {
      result += pinyin.toLowerCase()
    } else if (/[a-zA-Z]/.test(char)) {
      result += char.toLowerCase()
    }
  }
  return result
}

/**
 * 智能搜索商品
 * @param {Array} products - 商品列表
 * @param {String} keyword - 搜索关键词
 * @returns {Array} - 匹配的商品列表
 */
export function smartSearch(products, keyword) {
  if (!keyword || !keyword.trim()) {
    return products
  }

  const searchTerm = keyword.toLowerCase().trim()
  
  return products.filter(product => {
    // 1. 商品名称完全匹配
    if (product.name.toLowerCase().includes(searchTerm)) {
      return true
    }

    // 2. 品牌完全匹配
    if (product.brand && product.brand.toLowerCase().includes(searchTerm)) {
      return true
    }

    // 3. 分类匹配
    if (product.category && product.category.toLowerCase().includes(searchTerm)) {
      return true
    }

    // 4. 颜色匹配
    if (product.color && product.color.toLowerCase().includes(searchTerm)) {
      return true
    }

    // 5. 尺码匹配
    if (product.size && product.size.toString().includes(searchTerm)) {
      return true
    }

    // 6. 拼音首字母匹配
    const nameInitials = getPinyinInitials(product.name)
    if (nameInitials.includes(searchTerm)) {
      return true
    }

    const brandInitials = product.brand ? getPinyinInitials(product.brand) : ''
    if (brandInitials.includes(searchTerm)) {
      return true
    }

    // 7. 完整拼音匹配
    const namePinyin = getFullPinyin(product.name)
    if (namePinyin.includes(searchTerm)) {
      return true
    }

    const brandPinyin = product.brand ? getFullPinyin(product.brand) : ''
    if (brandPinyin.includes(searchTerm)) {
      return true
    }

    // 8. 英文品牌名匹配（如 nike → 耐克）
    const englishBrands = {
      'nike': '耐克',
      'adidas': '阿迪达斯',
      'newbalance': '新百伦',
      'nb': '新百伦',
      'converse': '匡威',
      'vans': 'vans',
      'puma': '彪马',
      'reebok': '锐步',
      'asics': '亚瑟士',
      'skechers': '斯凯奇',
      'fila': '斐乐',
      'kappa': '卡帕',
      'lining': '李宁',
      'anta': '安踏',
      'xtep': '特步',
      'jordan': '乔丹',
      '361': '361度'
    }

    for (const [english, chinese] of Object.entries(englishBrands)) {
      if (searchTerm.includes(english) && product.brand && product.brand.includes(chinese)) {
        return true
      }
      if (searchTerm.includes(chinese) && product.brand && product.brand.includes(chinese)) {
        return true
      }
    }

    // 9. 数字匹配（如搜索 270 找到 Air Max 270）
    if (/\d+/.test(searchTerm)) {
      const numbers = searchTerm.match(/\d+/g)
      if (numbers) {
        for (const num of numbers) {
          if (product.name.includes(num)) {
            return true
          }
        }
      }
    }

    return false
  })
}

/**
 * 搜索建议（自动补全）
 */
export function getSearchSuggestions(products, keyword) {
  if (!keyword || keyword.length < 2) {
    return []
  }

  const results = smartSearch(products, keyword)
  const suggestions = new Set()

  results.forEach(product => {
    suggestions.add(product.name)
    if (product.brand) suggestions.add(product.brand)
  })

  return Array.from(suggestions).slice(0, 5)
}

/**
 * 搜索历史管理
 */
export class SearchHistory {
  constructor(maxSize = 10) {
    this.maxSize = maxSize
    this.storageKey = 'searchHistory'
  }

  // 获取搜索历史
  getHistory() {
    const history = localStorage.getItem(this.storageKey)
    return history ? JSON.parse(history) : []
  }

  // 添加搜索记录
  addHistory(keyword) {
    if (!keyword || !keyword.trim()) return

    let history = this.getHistory()
    
    // 移除重复项
    history = history.filter(item => item !== keyword)
    
    // 添加到开头
    history.unshift(keyword)
    
    // 限制数量
    if (history.length > this.maxSize) {
      history = history.slice(0, this.maxSize)
    }

    localStorage.setItem(this.storageKey, JSON.stringify(history))
  }

  // 清空搜索历史
  clearHistory() {
    localStorage.removeItem(this.storageKey)
  }

  // 删除单条历史
  removeHistory(keyword) {
    let history = this.getHistory()
    history = history.filter(item => item !== keyword)
    localStorage.setItem(this.storageKey, JSON.stringify(history))
  }
}

