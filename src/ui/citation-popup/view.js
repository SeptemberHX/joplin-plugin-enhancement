/* 
For some reason, Joplin does not load the scripts in order.
This strange behavior was causing the current script to load before he.min.js
resulting in "he is not defined" error.
The quick and dirty way to solve this bug is to make sure the current script
waits until all the other scripts get loaded by Joplin,
and then starts doing its job
*/
const intervalId = setInterval(() => {
    if (typeof he !== "undefined") {
        clearInterval(intervalId);
        main();
    }
}, 100);

/* UI Elements */
const inputRefsView = document.getElementById("json");
const selectedRefsView = document.getElementById("selected_refs_list");
const output = document.getElementById("output");

function main() {
    /* State */
    let refs = null;
    try {
        refs = JSON.parse(unescape(inputRefsView.textContent));
    } catch (e) {
        console.log(e);
    }

    const state = {
        // parse the refs data, get the name of the first author
        refs: refs.map((ref) => {
            return {
                id: ref["id"],
                title: ref["title"] || "",
                year: ref["year"] ? ref["year"].toString() : "",
                author: ref["author"]
                    ? ref.author[0] : "",
                from: ref["from"] || "Unknown",
            };
        }),
        selectedRefs: new Set(),
    };

    configAutoComplete();

    /* Event Listeners */
    selectedRefsView.addEventListener("click", (event) => {
        if (event.target.classList.contains("icon_remove")) {
            removeReference(event.target.parentNode.id);
        }
    });

    function configAutoComplete() {
        const autoCompleteJS = new autoComplete({
            placeHolder: "Search for references...",
            data: {
                src: state.refs,
                keys: ["title", "author", "year", "from"],
                filter: (list) => {
                    const filteredResults = [];
                    list.forEach((item) => {
                        if (state.selectedRefs.has(item.value["id"])) return;
                        if (
                            !filteredResults.find(
                                (res) => res.value["id"] === item.value["id"]
                            )
                        ) {
                            filteredResults.push(item);
                        }
                    });

                    return filteredResults;
                },
            },
            resultsList: {
                noResults: true,
                maxResults: 15,
                tabSelect: true,
            },
            resultItem: {
                element: renderRef,
                highlight: true,
            },
            events: {
                input: {
                    focus: () => {
                        if (autoCompleteJS.input.value.length)
                            autoCompleteJS.start();
                    },
                },
            },
        });
        autoCompleteJS.searchEngine = "strict";

        // Focus the input field
        autoCompleteJS.input.focus();

        autoCompleteJS.input.addEventListener("selection", (event) => {
            const feedback = event.detail;
            const selection = feedback.selection.value;
            addReference(selection["id"]);

            // Empty the contents of the text field
            // after adding the reference to the selected area
            autoCompleteJS.input.value = "";
        });
    }

    function addReference(refId = "") {
        state.selectedRefs.add(refId);
        render();
    }

    function removeReference(refId = "") {
        state.selectedRefs.delete(refId);
        render();
    }

    /* Rendering state-based UI */
    function render() {
        const selectedRefsArray = Array.from(state.selectedRefs);
        selectedRefsView.innerHTML = template(selectedRefsArray);
        output.value = JSON.stringify(selectedRefsArray);
    }

    /**
     * Returns an HTML representation of an array of refs
     * @param {Reference[]} refs
     * @returns string
     */
    function template(refs = []) {
        if (refs.length === 0) {
            return "Select some references to be added to the current note";
        }
        return refs
            .map((refId) => state.refs.find((r) => r["id"] === refId)) // id => reference
            .map(
                (ref) => `
                    <li id="${he.encode(ref["id"])}">
                        <span class="title">
                            <strong>${he.encode(ref["title"])}</strong>
                            <br>
                            ${he.encode(ref["author"])}
                            <br>
                            ${he.encode(ref["year"])}, <i>${he.encode(ref["from"])}</i>
                        </span>
                        <span class="icon_remove">x</span>
                    </li>
                `
            ) // reference => <li>
            .join(" ");
    }
}

function renderRef(item, data) {
    const ref = data.value;

    // Modify Results Item Style
    item.style = "display: flex; justify-content: space-between;";
    // Modify Results Item Content
    item.innerHTML = `
        <span style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
            <strong>${he.encode(ref["title"])}</strong>
            <br>
            <span style="color: #27ae60">${he.encode(ref["author"])}</span>
            <br>
            ${he.encode(ref["year"])}, <i>${he.encode(ref["from"])}</i>
        </span>
    `;
}
