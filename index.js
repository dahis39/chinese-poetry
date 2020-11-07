const fs = require('fs')
const glob = require("glob")

const COMMA = "，"
const PERIOD = "。"
const QUESTION_MARK = "？"

const main = () => {
  glob("json/poet.*.json", null, function (er, files) {
    let phrases = []

    files.forEach(file => {
      console.log("processing " + file)

      const rawdata = fs.readFileSync(file)
      const json = JSON.parse(rawdata)

      phrases = phrases.concat(extractPhrases(json))
    })

    const result = phrases.join("\n")
    fs.writeFile('result.txt', result, function (err) { if (err) return console.log(err) })
    console.log("Done")
  })
}

const extractPhrases = (json) => {
  let phrases = []

  json.forEach(poem => {
    poem.paragraphs.forEach(line => {
      // These get flagged as 存疑, but should still be valid.
      line = replaceAll(replaceAll(line,"[", ""), "]", "")

      // Whole line combined as one phrase.
      phrases.push(replaceDelimiters(line, ""))

      // Split by delimiters to get inner phrases.
      line = replaceDelimiters(line, COMMA) // unify delimiter
      line.split(COMMA).forEach(phrase => {
        phrases.push(phrase.replace(PERIOD, ""))
      })
    })
  })

  phrases = flatten(phrases)
  phrases = phrases.filter(Boolean)  // remove falsy
  phrases = phrases.filter(p => p.length <= 15 && p.length >= 2)
  phrases = removeInvalidPhrasesWithSpecialPunctuations(phrases)

  return phrases
}

const replaceDelimiters = (src, replaceValue) => {
  return replaceAll(src, COMMA, replaceValue).replace(PERIOD, replaceValue).replace(QUESTION_MARK, replaceValue)  // these all need to be replaceAll, but it runs very slow.
}

const flatten = (arr) => {
  return arr.reduce(function (flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  }, []);
}

const replaceAll = (src, target, replaceValue) => {
  return src.split(target).join(replaceValue)
}

const removeInvalidPhrasesWithSpecialPunctuations = (phrases) => {
  // invalid punctuations
  const punctuations = ["）" ,"（" , "《", "》", "「", "」", "-", ">", "〖", "〗", PERIOD, "□", "：", "、", "『", "』"]

  return phrases.filter(phrase => {
    let contains = false
    punctuations.forEach(punc => {
      if (phrase.includes(punc)) {
        contains = true
      }
    })
    return !contains  // flip this, you can get a list of invalid phrases
  })
}

main()