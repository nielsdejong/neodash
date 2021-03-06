import React from "react";
import TextInput from "react-materialize/lib/TextInput";
import {Autocomplete, Preloader} from "react-materialize";

/**
 * An auto-completing text-box component.
 * The text box will autocomplete and show values based on a configured node property in the database.
 */
class NeoAutoCompleteText extends React.Component {
    /**
     * On init, set up a default state for the autocomplete textbox.
     */

    constructor(props) {
        super(props);
        this.state = {
            key: 0,
            input: "",
            value: this.props.defaultValue,
            running: false,
            data: {}
        }
        let title = this.props.label + " " + this.props.property;
        this.onChange = this.onChange.bind(this);
        this.onAutoComplete = this.onAutoComplete.bind(this);
        this.autocomplete = <Autocomplete autoComplete={"off"} onChange={this.onChange}
                                          style={this.props.customStyle}
                                          placeholder={this.props.defaultValue}
                                          title={title} value={this.props.defaultValue}/>;

        // Clear the autocompleted field when the component is reset.
        this.onAutoComplete(this.props.defaultValue);
    }



    /**
     * When the user types in the autocomplete box, run a Cypher query to dynamically create suggestions.
     * @param e: the event containing the new value.
     */
    async onChange(e) {
        // No event, cancel the handler.
        if (!e) {
            return;
        }
        // if we're still waiting for an autocomplete search, do nothing.
        if (this.state.running) {
            return;
        }
        // if the autocomplete gets cleared after having a value, clear the global parameters
        if (e !== null && e.target !== null && e.target.value === "" && this.state.input !== "") {
            this.state.input = "";
            this.onAutoComplete("");
        }
        this.state.running = true;

        // If the event is there, update the newly selected input value
        if (e !== null && e.target !== null) {
            this.state.input = e.target.value;
            // return
        }

        // Optionally submit the value as soon as it's selected (before autocomplete)
        if (this.props.onChange) {
            this.props.onChange(this.props.label, this.props.property, this.props.propertyId, this.state.input)
            return
        }
        this.retrieveAutocompleteSuggestionsFromDatabase();

    }

    /**
     * Gets some autocompleted values from the Neo4j database based on user input.
     */
    async retrieveAutocompleteSuggestionsFromDatabase() {



        if (this.state.input == null) {
            return
        }


            this.props.session
                .run(this.props.query, {input: this.state.input})
                .catch(error => {
                    console.error(error);
                    this.state.running = false;
                })
                .then(result => {

                    //do stuff
                    // Create a list of 'choices', e.g. autocompleted values
                    if (result && result.records !== null) {
                        var choices = {};
                        var types = {};
                        result.records.map((record, i) => {
                            record["_fields"].map((key, index) => {
                                let value = record["_fields"][index];
                                let type = !isNaN(value["low"]) || typeof value == "number" ? "number" : "string";
                                choices[value] = null;
                                types[value] = type;
                            });
                        });
                        this.state.running = false;
                        this.state.data = choices;
                        this.state.types = types;
                        let options = {
                            data: this.state.data, limit: 4, onAutocomplete: this.onAutoComplete
                        };
                        let title = this.props.label + " " + this.props.property;
                        this.autocomplete = <Autocomplete autoComplete={"off"} options={options} onChange={this.onChange}
                                                          value={this.state.input}
                                                          placeholder={""} style={this.props.customStyle}
                                                          title={title}/>;
                        this.forceUpdate();
                    }


                })


    }

    /**
     * Whenever the autocomplete triggers, we submit the selected value to the report.
     * @param value: the new value selected.
     */
    onAutoComplete(value) {
        if (this.state.types && this.state.types[value] === "number") {
            value = Number(value)
        }
        this.props.onAutoComplete(this.props.label, this.props.property, this.props.propertyId, value)
    }

    /**
     * Draw the autocomplete box.
     */
    render() {
        return <div className={"autocomplete-div"}>
            {this.autocomplete}
            {(this.state.running) ?  <div style={{"marginTop": "40px", "position": "absolute", "left": "300px","top": "55px"}}>
                <Preloader color="green" size={"small"} />
             </div> : <div></div> }
        </div>;
    }
}

export default (NeoAutoCompleteText);