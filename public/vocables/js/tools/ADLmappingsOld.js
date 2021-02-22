/** The MIT License
 Copyright 2020 Claude Fauconnet / SousLesens Claude.fauconnet@gmail.com

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var ADLmappings = (function () {

        var self = {}
        self.currentSource;
        self.prefixes = {
            "http://www.w3.org/1999/02/22-rdf-syntax-ns#": "rdf",
            "http://www.w3.org/1999/02/22-rdf-syntax-ns#": "rdfs",
            "http://www.w3.org/2002/07/owl#": "owl",
            "http://data.total.com/resource/one-model/ontology/": "total"


        }
        self.sampleData = {}
        var constraintsMap = {}
        var allObjectsMap = {}
        //  self.currentMappingsMap={type:"",joins:[],relations:[] }
        self.currentMappingsMap = null;
        self.init = function () {
            self.subjectPropertiesMap = {}
            self.typedObjectsMap = {}
            self.sheetJoinColumns = {}
            constraintsMap = {}
            allObjectsMap = {}
        }
        self.init()


        self.onLoaded = function () {


            $("#actionDivContolPanelDiv").html(" <button onclick=\"ADLmappings.loadXlsModel()\">open Xls Model</button>" +
                " <button onclick=\"ADLmappings.loadADL_SQLModel()\">load ADL Model</button>");
            $("#actionDiv").html(" <div id=\"ADLmappings_dataModelTree\"  style=\"width:400px\"></div>");
            $("#accordion").accordion("option", {active: 2});

            MainController.UI.toogleRightPanel(true)
            $("#graphDiv").load("./snippets/ADL/ADLmappings.html");
            setTimeout(function () {
                $("#rightPanelDiv").html(" <div> Ontology  Properties <div id=\"ADLmappings_ontologyPropertiesTree\" style=\"width:400px\"></div></div>")
                self.currentSource = Config.ADLMappings.currentOntology;
                ADLmappings.loadOntology()
            }, 200)

        }
        self.onSourceSelect = function (source) {
            self.currentSource = source;
            OwlSchema.currentSourceSchema = null;

            self.loadOntology();


        }


        self.jstreeContextMenu = function (type) {
            function getSelectedNode(e) {
                var treeId = e.reference.context.id
                return $("#" + treeId).jstree(true).get_selected(true)[0]
            }

            var items = {};
            if (!type)
                return;
            if (type == "Column") {
                items.tripleSubject = {
                    label: "tripleSubject",
                    action: function (e) {// pb avec source
                        var ss = getSelectedNode(e)

                        self.setTripleObject("Subject", getSelectedNode(e).data)
                    }

                }
                items.newTripleSubject = {
                    label: "newTripleSubject",
                    action: function (e) {
                        var x = e.reference.prevObject[0]
                        self.setTripleObject("Subject", getSelectedNode(e).data, true)
                    }

                }
                items.tripleObject = {
                    label: "tripleObject",
                    action: function (e) {
                        var x = e.reference.prevObject[0]
                        var text = x.innerText
                        self.setTripleObject("Object", getSelectedNode(e).data)
                    }
                }

                items.joinColumnStart = {
                    label: "joinColumnStart",
                    action: function (e) {
                        var x = e.reference.prevObject[0]
                        var text = x.innerText
                        self.startJoiningColumn = getSelectedNode(e).data.id
                    }
                }
                if (true || self.startJoiningColumn) {
                    items.joinColumnEnd = {
                        label: "joinColumnEnd",
                        action: function (e) {
                            var x = e.reference.prevObject[0]
                            var text = x.innerText
                            self.endJoiningColumn = getSelectedNode(e).data.id
                            self.joinSheetColumns()
                        }
                    }
                }


            }
            return items
        }


        self.joinSheetColumns = function () {
            var start = self.startJoiningColumn;
            var end = self.endJoiningColumn;
            $("#ADLmappings_dataModelTree").jstree(true).rename_node(self.endJoiningColumn, "<span  class='joinColumn'>" + self.endJoiningColumn + "=" + self.startJoiningColumn + "</span>")
            if (!self.sheetJoinColumns[start])
                self.sheetJoinColumns[start] = []
            self.sheetJoinColumns[start].push(end)
            if (!self.sheetJoinColumns[end])
                self.sheetJoinColumns[end] = []
            self.sheetJoinColumns[end].push(start)

        }

        self.setTripleObject = function (type, nodeData) {


            if (type == "Subject") {
                self.currentColumn = nodeData.id;
                if (!self.typedObjectsMap[nodeData.id]) {

                    self.typedObjectsMap[nodeData.id] = {};
                    self.drawPropertiesTree("rdf:type")


                } else {
                    var propertiesFilter = constraintsMap.domains[self.typedObjectsMap[nodeData.id].type]
                    self.drawPropertiesTree(propertiesFilter)
                }


            }


        }


        self.displayMappings = function () {


            //    data: {type: "triple", object: self.currentColumn, predicate: propertyNode, object: obj.node.data.id}
            var data = {
                mappings: [],
                sheetJoinColumns: self.sheetJoinColumns,
            };


            var nodes = common.getjsTreeNodes("ADLmappings_dataModelTree")

            for (var key in self.typedObjectsMap) {
                if (self.typedObjectsMap[key].type) {
                    data.mappings.push({
                        subject: key,
                        predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                        object: self.typedObjectsMap[key].type


                    })
                }
            }
            nodes.forEach(function (node) {

                if (node.data.type == "triple") {
                    var subject = node.data.subject
                    var predicate = node.data.predicate
                    var object = node.data.object
                    if (subject && predicate && object) {
                        data.mappings.push({
                            subject: subject,
                            predicate: predicate,
                            object: object

                        })
                    }
                }

            })


            $("#mainDialogDiv").html(JSON.stringify(data, null, 2))
            $("#mainDialogDiv").dialog("open")

        }


        self.drawPropertiesTree = function (properties) {
            var propJstreeData = []
            if (properties == "rdf:type") {
                var idType = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
                propJstreeData.push({
                    id: idType,
                    text: "rdf:type",
                    parent: "#",
                    data: {id: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", label: "rdf:type", source: self.currentSource}
                })
                for (var key in allObjectsMap) {
                    if (allObjectsMap[key].type == "Class") {// && allObjectsMap[key].isLeaf) {

                        var label = allObjectsMap[key].label
                        propJstreeData.push({
                            id: key,
                            text: label,
                            parent: idType,
                            data: {id: key, label: label, source: self.currentSource}
                        })
                    }
                }
            } else {
                properties.forEach(function (prop) {


                    var label = allObjectsMap[prop].label || prop
                    propJstreeData.push({
                        id: prop,
                        text: label,
                        parent: "#",
                        data: {id: key, label: key, source: self.currentSource}
                    })

                    for (var range in constraintsMap.properties[prop]) {
                        var label = allObjectsMap[range].label || range

                        propJstreeData.push({
                            id: range,
                            text: label,
                            parent: prop,
                            data: {id: range, label: label, source: self.currentSource}

                        })
                        if (constraintsMap.properties[prop][range]) {
                            constraintsMap.properties[prop][range].forEach(function (item) {
                                propJstreeData.push({
                                    id: item,
                                    text: "<span class='rangeValue' >" + item + "</span>",
                                    parent: range,
                                    data: {id: item, label: item, source: self.currentSource}

                                })


                            })
                        }
                    }
                })

            }
            var optionsClass = {
                selectTreeNodeFn: self.onselectPropertiesNode,
                openAll: true
            }
            common.loadJsTree("ADLmappings_ontologyPropertiesTree", propJstreeData, optionsClass)


        }
        self.onselectPropertiesNode = function (event, obj) {
            var parentNode = obj.node.parent
            if (parentNode == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                self.typedObjectsMap[self.currentColumn].type = obj.node.data.id

                var modelNode = $("#ADLmappings_dataModelTree").jstree(true).get_node(self.currentColumn)
                var propLabel = allObjectsMap[obj.node.data.id].label
                $("#ADLmappings_dataModelTree").jstree(true).rename_node(self.currentColumn, "<span  class='typedColumn'>" + propLabel + ":" + modelNode.data.label + "</span>")

                self.setSampleColumnType(obj.node)
                self.graph.drawNode(self.currentColumn, {type: obj.node.data.label})
                for (var prop in constraintsMap.properties) {
                    if (constraintsMap.properties[prop][obj.node.data.id])
                        if (constraintsMap.properties[prop][obj.node.data.id].indexOf(self.currentColumn) < 0)
                            constraintsMap.properties[prop][obj.node.data.id].push(self.currentColumn)
                }


            } else {

                if (obj.node.parents.length < 3)
                    return;
                var propertyNode = obj.node.parents[1]
                var newChildren = [];
                var label = allObjectsMap[propertyNode].label + "->" + allObjectsMap[parentNode].label + ":" + obj.node.data.label
                newChildren.push({
                    id: "_" + propertyNode + "_" + self.currentColumn,
                    text: "<span class='typedColumn'>" + label + "</span>",
                    parent: self.currentColumn,
                    data: {type: "triple", subject: self.currentColumn, predicate: propertyNode, object: obj.node.data.id}

                })
                common.addNodesToJstree("ADLmappings_dataModelTree", self.currentColumn, newChildren)
                self.setSampleColumnRelation(obj.node, {subject: self.currentColumn, predicate: propertyNode, object: obj.node.data.id})
                self.graph.drawNode(self.currentColumn, {predicate: allObjectsMap[propertyNode].label, object: obj.node.data.label})
            }

        }


        self.setSampleColumnType = function (node) {
            $("#dataSample_type_" + self.currentColumn.replace(".", "__")).html(node.data.label)
            self.currentMappingsMap[self.currentColumn.replace(".", "__")].type = node.data.label


        }


        self.setSampleColumnRelation = function (node, mapping) {
            $("#dataSample_mapping_" + self.currentColumn.replace(".", "__")).append(mapping.predicate + " " + mapping.object)
            self.currentMappingsMap[self.currentColumn.replace(".", "__")].mappings.push(mapping)

        }

        self.loadOntology = function () {

            var classJstreeData = []
            var depth = 5;
            var propertyJstreeData = [{
                id: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                text: "type",
                parent: "#",
                data: {type: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", id: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", label: "type", source: self.currentSource}
            },
                {
                    id: "http://www.w3.org/2000/01/rdf-schema#label",
                    text: "label",
                    parent: "#",
                    data: {type: "http://www.w3.org/2000/01/rdf-schema#label", id: "http://www.w3.org/2000/01/rdf-schema#label", label: "label", source: self.currentSource}
                }]
            constraintsMap = {domains: [], properties: [], ranges: []}


            async.series([


                    //load restrictions
                    function (callbackSeries) {
                        var objs = []
                        Sparql_OWL.getObjectRestrictions(self.currentSource, null, null, function (err, result) {
                            if (err)
                                return callbackSeries(err)

                            result.forEach(function (item) {

                                if (!item.value) {
                                    item.value = {value: "any"}
                                }
                                var hasId = true
                                if (!item.id) {
                                    item.id = {value: "any"}
                                    hasId = false
                                }

                                var obj = {property: item.prop.value, domain: item.id.value, range: item.value.value}
                                allObjectsMap[item.prop.value] = {type: "Property", label: item.propLabel.value, data: obj}

                                objs.push(obj)
                            })
                            objs.forEach(function (obj) {
                                if (!constraintsMap.domains[obj.domain])
                                    constraintsMap.domains[obj.domain] = []
                                if (constraintsMap.domains[obj.domain].indexOf(obj.property) < 0)
                                    constraintsMap.domains[obj.domain].push(obj.property)

                                if (!constraintsMap.ranges[obj.range])
                                    constraintsMap.ranges[obj.range] = []
                                if (constraintsMap.ranges[obj.range].indexOf(obj.property) < 0)
                                    constraintsMap.ranges[obj.range].push(obj.property)

                                if (!constraintsMap.properties[obj.property])
                                    constraintsMap.properties[obj.property] = {}

                                constraintsMap.properties[obj.property][obj.range] = []

                            })

                            callbackSeries();
                        })


                    },
                    // loadClasses
                    function (callbackSeries) {

                        /*   Sparql_OWL.getNodeChildren(self.currentSource, null, null, depth, null, function (err, result) {
                               var existingNodes = {}


                               result.forEach(function (item) {
                                   allObjectsMap[item.concept.value] = {type: "Class", label: item.conceptLabel.value, data: {}, idRoot: true}

                                   for (var i = 1; i < depth; i++) {
                                       var childObj = item["child" + i]
                                       var obj
                                       if (childObj) {
                                           obj = {type: "Class", label: childObj.value, data: {}};

                                           if (i == 1) {
                                               obj.parent = item.concept.value
                                           } else {
                                               obj.parent = item["child" + (i - 1)].value

                                           }
                                           allObjectsMap[childObj.value] = obj;
                                       }
                                   }
                               })


                               result.forEach(function (item) {
                                   for (var i = 1; i < depth; i++) {
                                       var done = false
                                       var childObj = item["child" + i]

                                       if(item.concept)
                                       if (!childObj || childObj=== undefined) {

                                           if (i == 1) {
                                               allObjectsMap[item.concept.value].isLeaf = true;
                                               console.log(item.concept.value)
                                           } else {
                                               if (item["child" + (i - 1)]) {

                                                   allObjectsMap[item["child" + (i - 1)].value].isLeaf = true;
                                                   console.log(item["child" + (i - 1)].value)
                                               }


                                           }

                                       }
                                   }
                               })


                               callbackSeries()
                           })*/
                        var filter = "?concept rdf:type owl:Class"
                        Sparql_OWL.getItems(self.currentSource, {filter: filter}, function (err, result) {
                            if (err)
                                return callbackSeries(err)
                            result.forEach(function (item) {
                                if (constraintsMap.domains[item.concept.value] || constraintsMap.ranges[item.concept.value])
                                    allObjectsMap[item.concept.value] = {type: "Class", label: item.conceptLabel.value, data: {}}


                            })
                            callbackSeries()
                        })
                    },


                ],

                function (err) {
                    if (err)
                        return MainController.UI.message(message)

                }
            )
        }


        self.loadADL_SQLModel = function () {
            var dbName = "clov"

            $.ajax({
                type: "POST",
                url: Config.serverUrl,
                data: {ADLquery: 1, getModel: dbName},
                dataType: "json",

                success: function (data, textStatus, jqXHR) {
                    self.configureModel(data, dbName)

                },
                error: function (err) {
                    alert(err);
                }
            })


        }

        self.loadXlsModel = function (path) {

            var path = "D:\\NLP\\ontologies\\assets\\turbogenerator\\TO-G-6010A FJ-BCmodel.json"
            var payload = {
                triplesGenerator: 1,
                getJsonModel: path
            }


            $.ajax({
                type: "POST",
                url: Config.serverUrl,
                data: payload,
                dataType: "json",

                success: function (data, textStatus, jqXHR) {
                    self.configureModel(data, path)
                }
                , error: function (err) {


                    $("#waitImg").css("display", "none");
                    console.log(JSON.stringify(err))
                    console.log(JSON.stringify(query))
                    MainController.UI.message(err.responseText);
                }
            })


        }

        self.configureModel = function (data, source) {

            if (self.currentMappingsMap) {

            } else {
                self.currentMappingsMap = {}
            }
            var modelJstreeData = []
            var existingNodes = {}
            for (var key in data) {
                modelJstreeData.push({
                    id: key,
                    text: key,
                    parent: "#",
                    data: {type: "table", id: key, label: key, source: source}
                })

                data[key].forEach(function (item) {

                    modelJstreeData.push({
                        id: key + "." + item,
                        text: item,
                        parent: key,
                        data: {type: "column", id: key + "." + item, label: item, source: source}

                    })
                })
            }

            var options = {
                selectTreeNodeFn: function (event, obj) {
                    self.currentModelJstreeNode = obj.node
                    self.currentJstreeNode = obj.node;
                    self.setTripleObject("Subject", obj.node.data)
                    self.showSampleData(obj.node)

                },
                contextMenu: self.jstreeContextMenu("Column")
            }
            common.loadJsTree("ADLmappings_dataModelTree", modelJstreeData, options)
            $("#waitImg").css("display", "none");
        }

        self.showSampleData = function (node) {
            var limit = 10
            var dbName = node.data.source;
            var table;
            if (node.parents.length == 1)
                table = node.id
            if (node.parents.length == 2)
                table = node.parent
            if (node.parents.length == 3)
                table = node.parents[node.parents[2]]

            function displaySampleData(data) {
                var cols = []
                var str = "<table><tr>"
                var strTypes = ""
                var strMappings = ""
                var strJoins = ""
                data.forEach(function (item) {
                    for (var key in item) {
                        if (cols.indexOf(key) < 0) {
                            cols.push(key);
                            var colId = table + "__" + key;
                            var colType = "";
                            var colMappings = ""
                            var colJoins = ""
                            if (!self.currentMappingsMap[colId])
                                self.currentMappingsMap[colId] = {type: "", joins: [], mappings: []}
                            else {
                                colType = self.currentMappingsMap[colId].type
                                colMappings = JSON.stringify(self.currentMappingsMap[colId].mappings)
                                colJoins = JSON.stringify(self.currentMappingsMap[colId].joins)

                            }

                            str += "<td class='dataSample_cell'>" + key + "</td>"
                            //   strJoins += "<td  class='dataSample_cell dataSample_join'<span id='dataSample_join_" + colId + "'>" + colJoins + "</span> </td>"
                            strTypes += "<td  class='dataSample_cell dataSample_type'<span id='dataSample_type_" + colId + "'>" + colType + "</span> </td>"

                            //   strMappings += "<td  class='dataSample_cell dataSample_mapping'<span id='dataSample_mapping_" + colId + "'>" + colMappings + "</span> </td>"
                        }
                    }
                })
                str += "</tr>"

                str += "<tr>" + strTypes + "</tr>"
                //   str += "<tr>" + strMappings + "</tr>"
                //   str += "<tr>" + strJoins + "</tr>"

                data.forEach(function (item) {
                    str += "<tr>"
                    cols.forEach(function (col) {
                        var value = ""

                        if (item[col]) {
                            value = item[col]
                        }
                        str += "<td class='dataSample_cell dataSample_cellValue'>" + value + "</td>"
                    })
                    str += "</tr>"
                })

                $("#ADLmappings_dataSampleDiv").html(str)
                setTimeout(function () {
                    /*  $(".dataSample_join").bind("click", function () {

                      })*/

                    $(".dataSample_type").bind("click", function () {
                        var nodeId = $(this).attr("id").substring(16).replace("__", ".")
                        self.showNodePropertiesTree(nodeId)


                      


                    })
                    /*   $(".dataSample_mapping").bind("click", function () {

                       })*/

                })
            }


            if (self.sampleData[table]) {

                displaySampleData(self.sampleData[table])
            } else {

                var sqlQuery = " select * from " + table + " limit " + limit;

                $.ajax({
                    type: "POST",
                    url: Config.serverUrl,
                    data: {ADLquery: 1, getData: 1, dbName: dbName, sqlQuery: sqlQuery},
                    dataType: "json",

                    success: function (data, textStatus, jqXHR) {

                        self.sampleData[table] = data,
                            displaySampleData(self.sampleData[table])
                    }
                    , error: function (err) {


                    }
                })
            }
        }


        self.showNodePropertiesTree = function (nodeId) {
            $("#ADLmappings_dataModelTree").jstree(true).select_node(nodeId)
            var jstreeNode = $("#ADLmappings_dataModelTree").jstree(true).get_node(nodeId)
            self.currentModelJstreeNode = jstreeNode
            self.currentJstreeNode = jstreeNode;
            self.setTripleObject("Subject", jstreeNode.data)
        }




        self.graph = {
            attrs: {
                table: {shape: "ellipse", color: "grey"},
                column: {shape: "box", color: "#9edae5"},


            },

            drawNode: function (columnObj, targetObj) {
                var existingNodes = visjsGraph.getExistingIdsMap()
                var visjsData = {nodes: [], edges: []}
                var array = columnObj.split(".")
                var table = array[0]
                var column = array[1]

                if (targetObj.object) {

                    if (!existingNodes[targetObj.object]) {
                        var array = targetObj.object.split(".")
                        table = array[0]
                        column = array[1]

                    }
                }
                if (targetObj.predicate) {
                    var edgeId = columnObj + "_" + targetObj.predicate + "_" + targetObj.object
                    if (!existingNodes[edgeId]) {
                        existingNodes[edgeId] = 1
                        visjsData.edges.push({
                                id: edgeId,
                                from: columnObj,
                                to: targetObj.object,
                                label: targetObj.predicate,
                                arrows: "to"
                            }
                        )
                    }


                }


                /*   if (!existingNodes[table]) {
                       visjsData.nodes.push({
                               id: table,
                               label: table,
                               data: {type: table, id: table, label: table},
                               shape: ADLmappings.graph.attrs["table"].shape,
                               color: ADLmappings.graph.attrs["table"].color,
                           }
                       )
                   }*/
                if (!existingNodes[columnObj]) {
                    visjsData.nodes.push({
                            id: columnObj,
                            label: column + "\n" + targetObj.type,
                            data: {type: column, id: columnObj, label: column},
                            shape: ADLmappings.graph.attrs["column"].shape,
                            color: ADLmappings.graph.attrs["column"].color,
                        }
                    )
                }
                /*  var edgeId = table + "_" + columnObj
                  if (!existingNodes[edgeId]) {
                      visjsData.edges.push({
                          id: edgeId,
                          from: table,
                          to: columnObj,

                      })
                  }*/


                if (!visjsGraph.data || !visjsGraph.data.nodes) {
                    var options={selectNodeFn:function(node) {

                            ADLmappings.showNodePropertiesTree(node.id)
                        }
                    }
                    visjsGraph.draw("ADLmappings_graph", visjsData,options)
                } else {
                    visjsGraph.data.nodes.add(visjsData.nodes)
                    visjsGraph.data.edges.add(visjsData.edges)
                }
                visjsGraph.network.fit()


            }


        }

        return self;
    }
)
()
