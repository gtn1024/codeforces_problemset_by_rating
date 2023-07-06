import axios from 'axios'
import fs from 'fs'

const HEADER_TEMPLATE_EN_US = `# Codeforces Problemset by Difficulty
[[SLOT]]
GitHub: <https://github.com/gtn1024/codeforces_problemset_by_rating>

## Index

[[toc]]`

const HEADER_TEMPLATE_ZH_CN = `# Codeforces 按照难度分类的题目列表
[[SLOT]]
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
  result = result.replace('[[SLOT]]', `
* 完整版：<https://vjudge.net/article/3779>
* [800, 1500)：<https://vjudge.net/article/3782>
* [1500, 2400)：<https://vjudge.net/article/3783>
* [2400, ∞)：<https://vjudge.net/article/3784>
`)
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
  fs.writeFileSync('./result.md', generateMarkdownForGeneral(HEADER_TEMPLATE_EN_US.replace('[[SLOT]]', ''), category))
  fs.writeFileSync('./result_zh_CN.md', generateMarkdownForGeneral(HEADER_TEMPLATE_ZH_CN.replace('[[SLOT]]', ''), category))

  const vjudge_part1 = {}
  const vjudge_part2 = {}
  const vjudge_part3 = {}
  Object.keys(category).forEach((key) => {
    if (key < 1500) { vjudge_part1[key] = category[key] }
  })
  Object.keys(category).forEach((key) => {
    if (1500 <= key && key < 2400) { vjudge_part2[key] = category[key] }
  })
  Object.keys(category).forEach((key) => {
    if (key >= 2400) { vjudge_part3[key] = category[key] }
  })
  fs.writeFileSync('./vjudge.md', generateMarkdownForVjudge(HEADER_TEMPLATE_ZH_CN, category))
  fs.writeFileSync('./vjudge_part1.md', generateMarkdownForVjudge(HEADER_TEMPLATE_ZH_CN, vjudge_part1))
  fs.writeFileSync('./vjudge_part2.md', generateMarkdownForVjudge(HEADER_TEMPLATE_ZH_CN, vjudge_part2))
  fs.writeFileSync('./vjudge_part3.md', generateMarkdownForVjudge(HEADER_TEMPLATE_ZH_CN, vjudge_part3))
})()
