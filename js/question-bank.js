/* Normalizes legacy and versioned question banks into one stable runtime shape. */
(() => {
  "use strict";
  const slug = value => String(value || "chapter").normalize("NFKD").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "chapter";

  function normalizeImages(images) {
    if (images == null) return [];
    if (!Array.isArray(images)) throw new Error("Question images must be an array.");
    return images.map((image, index) => {
      if (!image || typeof image !== "object") {
        throw new Error("Invalid image metadata at image " + (index + 1) + ".");
      }
      const src = String(image.src || "").trim();
      const alt = String(image.alt || "").trim();
      const isRasterDataUri = /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/i.test(src);
      const isRelativeAsset = /^(?:\.\/|\/)?[A-Za-z0-9._~!  function normalize(data, subjectId) {'()+,;=@%-]+(?:\/[A-Za-z0-9._~!  function normalize(data, subjectId) {'()+,;=@%-]+)*$/.test(src) &&
        !src.startsWith("//") && !src.split("/").includes("..") && !src.includes(":");
      if (!src || (!isRasterDataUri && !isRelativeAsset)) {
        throw new Error("Image " + (index + 1) + " must use a relative asset path or a PNG, JPEG, WebP or GIF data URI.");
      }
      if (!alt) throw new Error("Image " + (index + 1) + " needs descriptive alt text.");
      return { src, alt, caption: String(image.caption || "").trim() };
    });
  }

  function normalize(data, subjectId) {
    let source = data;
    if (data && !Array.isArray(data) && data.kind === "question-bank" &&
        data.schemaVersion === 1 && Array.isArray(data.chapters)) {
      source = data.chapters.map((chapter, i) => ({
        chapter_no: chapter.chapterNo || i + 1,
        title: chapter.title,
        key: chapter.chapterId,
        section: chapter.section,
        questions: (chapter.questions || []).map(question => ({
          id: question.questionId,
          question: question.prompt,
          options: question.options || [],
          answer: (question.options || []).findIndex(option => option.optionId === question.correctOptionId),
          explanation: question.explanation,
          difficulty: question.difficulty,
          questionId: question.questionId,
          images: question.images || []
        }))
      }));
    }
    if (!Array.isArray(source)) {
      throw new Error("Question bank must be a legacy chapter array or a schemaVersion 1 question-bank object.");
    }
    return source.map((chapter, i) => {
      const chapterNo = Number(chapter.chapter_no || chapter.chapterNo || i + 1);
      const chapterKey = String(chapter.key || chapter.chapterId || slug(chapter.title));
      if (!chapter.title || !Array.isArray(chapter.questions)) {
        throw new Error("A question-bank chapter is missing its title or questions.");
      }
      return {
        ...chapter,
        chapter_no: chapterNo,
        key: chapterKey,
        chapterKey,
        questions: chapter.questions.map((question, j) => {
          const rawId = question.questionId ?? question.id ?? ("q-" + (j + 1));
          const id = String(rawId);
          const options = Array.isArray(question.options)
            ? question.options.map(option => typeof option === "string" ? option : String(option.text ?? ""))
            : [];
          const answer = Number.isInteger(question.answer) ? question.answer : -1;
          if (!question.question && !question.prompt) {
            throw new Error("Question text is missing in " + chapter.title + ", question " + id + ".");
          }
          if (options.length < 2 || answer < 0 || answer >= options.length) {
            throw new Error("Invalid options or correct answer in " + chapter.title + ", question " + id + ".");
          }
          if (!question.explanation) {
            throw new Error("Explanation is missing in " + chapter.title + ", question " + id + ".");
          }
          const optionIds = Array.isArray(question.options)
            ? question.options.map((option, index) => typeof option === "string"
              ? "option-" + (index + 1)
              : String(option.optionId ?? ("option-" + (index + 1))))
            : [];
          const pairs = options.map((text, index) => ({
            text, optionId: optionIds[index], correct: index === answer
          }));
          for (let n = pairs.length - 1; n > 0; n--) {
            const z = Math.floor(Math.random() * (n + 1));
            [pairs[n], pairs[z]] = [pairs[z], pairs[n]];
          }
          return {
            ...question,
            question: question.question || question.prompt,
            id,
            legacyId: String(question.id ?? question.questionId ?? (j + 1)),
            options: pairs.map(pair => pair.text),
            optionIds: pairs.map(pair => pair.optionId),
            correctOptionId: (pairs.find(pair => pair.correct) || {}).optionId || ("option-" + (answer + 1)),
            answer: pairs.findIndex(pair => pair.correct),
            chapter_no: chapterNo,
            chapterKey,
            chapterTitle: chapter.title,
            images: normalizeImages(question.images),
            questionKey: String(subjectId) + "/" + chapterKey + "/q-" + id
          };
        })
      };
    });
  }

  window.C10QuestionBank = Object.freeze({
    schemaVersion: 1,
    normalize,
    normalizeImages,
    keyFor: (question, subjectId) => String(question.questionKey ||
      (String(subjectId) + "/" + String(question.chapterKey || ("chapter-" + question.chapter_no)) + "/q-" + question.id))
  });
})();
