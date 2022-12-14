export const htmlcsRunner = {
  scripts: [require.resolve("html_codesniffer_fork/build/HTMLCS.js")],
  run: async (options) => {
    const issueTypeMap = {
      1: "error",
      2: "warning",
      3: "notice",
    };

    function configureHtmlCodeSniffer() {
      if (
        !options.rules ||
        (options.rules && !options.rules.length) ||
        options.standard === "Section508"
      ) {
        return;
      }

      for (const rule of options.rules) {
        // @ts-ignore
        if (window.HTMLCS_WCAG2AAA.sniffs.includes(rule)) {
          window[`HTMLCS_${options.standard}`].sniffs[0].include.push(rule);
        } else {
          throw new Error(`${rule} is not a valid WCAG 2.1 rule`);
        }
      }
    }

    function runHtmlCodeSniffer() {
      return new Promise((resolve, reject) => {
        const runCodeSniffer = (htmlcs) => {
          htmlcs.process(
            options.standard,
            options.rootElement || window.document,
            (error) => {
              if (error) {
                return reject(error);
              }
              resolve(htmlcs.getMessages().map(processIssue));
            }
          );
        };

        // amd mod
        if (
          // @ts-ignore
          typeof window.define === "function" &&
          // @ts-ignore
          window.define.amd &&
          typeof window.require === "function"
        ) {
          // @ts-ignore
          window.require(["htmlcs"], (htmlcs) => {
            Object.keys(htmlcs).forEach((key) => {
              window[key] = htmlcs[key];
            });

            runCodeSniffer(htmlcs.HTMLCS);
          });
        } else {
          // @ts-ignore
          runCodeSniffer(window.HTMLCS);
        }
      });
    }

    function processIssue(issue) {
      return {
        code: issue.code,
        message: issue.msg,
        type: issueTypeMap[issue.type] || "unknown",
        element: issue.element,
        recurrence: issue.recurrence,
        runner: "htmlcs",
      };
    }

    configureHtmlCodeSniffer();

    return await runHtmlCodeSniffer();
  },
};
