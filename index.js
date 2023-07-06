import axios from 'axios'
import fs from 'fs'

const HEADER_TEMPLATE_EN_US = `# Codeforces Problemset by Difficulty

GitHub: <https://github.com/gtn1024/codeforces_problemset_by_rating>

## Index

[[toc]]`

const HEADER_TEMPLATE_ZH_CN = `# Codeforces 按照难度分类的题目列表

GitHub: <https://github.com/gtn1024/codeforces_problemset_by_rating>

## 目录

[[toc]]`

function generateTOC(category) {
  let result = ''
  Object.keys(category).forEach((key) => {
    result += `* [${key}](#${key})\n`
  })
  return result
}

function generateCategoryForGeneral(category, problems) {
  let result = ''
  result += `\n## ${category}\n\n`
  problems.forEach((item) => {
    const tags = item.tags.join(' ')
    result += `* [${item.name.trim().replace('<', '\\<').replace('>', '\\>')}](https://codeforces.com/problemset/problem/${item.contestId}/${item.index.trim()})${tags != '' ? `: ${tags}` : ''}\n`
  })
  return result
}

function generateBodyForGeneral(category) {
  let result = ''
  Object.keys(category).forEach((key) => {
    result += generateCategoryForGeneral(key, category[key])
  })
  return result
}

function generateMarkdownForGeneral(template, category) {
  let result = template.replace('[[toc]]', generateTOC(category))
  result += generateBodyForGeneral(category)
  return result
}

function generateCategoryForVjudge(category, problems) {
  let result = ''
  result += `\n## ${category}\n\n`
  problems.forEach((item) => {
    const tags = item.tags.join(' ')
    result += `[problem:CodeForces-${item.contestId}${item.index.trim()}]${tags != '' ? ` ${tags}` : ''}\n`
  })
  return result
}

function generateBodyForVjudge(category) {
  let result = ''
  Object.keys(category).forEach((key) => {
    result += generateCategoryForVjudge(key, category[key])
  })
  return result
}

function generateMarkdownForVjudge(template, category) {
  let result = template.replace('[[toc]]', generateTOC(category))
  result += generateBodyForVjudge(category)
  return result
}

(async () => {
  const data = await axios.get('https://codeforces.com/api/problemset.problems', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.67'
    }
  }).then((res) => {
    const problems = res.data.result.problems.filter((item) => !!item.rating)
    return problems
  }).catch((err) => {
    console.error(err);
    throw err
  })
  // Classification by difficulty
  const category = {}
  data.forEach((item) => {
    if (!category[item.rating]) {
      category[item.rating] = []
    }
    category[item.rating].push(item)
  })
  // write to file
  fs.writeFileSync('./result.md', generateMarkdownForGeneral(HEADER_TEMPLATE_EN_US, category))
  fs.writeFileSync('./result_zh_CN.md', generateMarkdownForGeneral(HEADER_TEMPLATE_ZH_CN, category))
  fs.writeFileSync('./vjudge.md', generateMarkdownForVjudge(HEADER_TEMPLATE_EN_US, category))
  fs.writeFileSync('./vjudge_zh_CN.md', generateMarkdownForVjudge(HEADER_TEMPLATE_ZH_CN, category))
})()
