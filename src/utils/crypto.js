/**
 * 密码加密工具
 * 使用 SHA-256 算法进行密码哈希
 */

/**
 * 使用 SHA-256 对密码进行哈希加密
 * @param {string} password - 明文密码
 * @returns {Promise<string>} - 加密后的密码哈希
 */
export async function hashPassword(password) {
  // 将密码转换为 ArrayBuffer
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  
  // 使用 SHA-256 进行哈希
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  
  // 将 ArrayBuffer 转换为十六进制字符串
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}

/**
 * 验证密码是否匹配
 * @param {string} password - 用户输入的明文密码
 * @param {string} hashedPassword - 存储的密码哈希
 * @returns {Promise<boolean>} - 是否匹配
 */
export async function verifyPassword(password, hashedPassword) {
  const hash = await hashPassword(password)
  return hash === hashedPassword
}

/**
 * 检查密码是否已加密
 * @param {string} password - 密码字符串
 * @returns {boolean} - 是否已加密（SHA-256 哈希为64位十六进制字符串）
 */
export function isPasswordHashed(password) {
  // SHA-256 哈希结果是64位十六进制字符串
  return /^[a-f0-9]{64}$/i.test(password)
}

/**
 * 迁移明文密码到加密密码
 * @param {string} password - 可能是明文或已加密的密码
 * @returns {Promise<string>} - 加密后的密码
 */
export async function migratePassword(password) {
  if (isPasswordHashed(password)) {
    // 已经是加密密码，直接返回
    return password
  }
  // 明文密码，进行加密
  return await hashPassword(password)
}
