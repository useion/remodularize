/**
 *  Example usage: node remodularize.js --in Output.json --out out
 */

var argv = require('minimist')(process.argv.slice(2)),
    path = require("path"),
    fstools = require('./useion/lib/helpers/fstools.js'),
    fs = require("fs"),
    utils = require("./useion/lib/helpers/utils.js");

var parser = require("./useion/lib/parser");

var inPath = argv['in'], //"direct",
    out = argv['out'];

var json = JSON.parse(fs.readFileSync(inPath, 'utf-8'));

for (var i in json) {
    var
    uc = json[i],
        ucName = uc.name,
        ucPath = uc.path,
        ucCamelCaseName = utils.camelCase(uc.name).replace(/[\s-]/g, '');


    var useCaseParser       = new parser.Usecase(),
        parser_usecase      = useCaseParser.parse(ucPath);

    var r = "# Use case "+parser_usecase.name+"\n\n";
    r+= "## Actors\n\nUser\n";
    for (var k in parser_usecase.actors) {
        var actor = parser_usecase.actors[k];
        r+= actor.name+"\n";
    }
    r+="\n## Main scenario\n\n";
    for (var k in parser_usecase.steps) {
        var step = parser_usecase.steps[k];
        if (step.section == "main_scenario")
           r+= step.orig_name+"\n";
    }
    var ac= 0;
    var a="\n## Alternate flows\n\n";
    for (var k in parser_usecase.steps) {
        var step = parser_usecase.steps[k];
        if (step.section == "alternate_flows") {
            ac++;
           a+= step.orig_name+"\n";
        }
    }
    if (ac>0) r+=a;

    r+="\n\n# Code\n\n";


    var inUc = {};
    for (var j in uc.steps) {
        var step = uc.steps[j];
        for (var m in step.methods) {
            var method  = step.methods[m],
                key = method.className+'-'+method.methodName,
                codePath = method.path,
                lang = fstools.extractExtension(method.path);

            if (key in inUc)
                continue;

            inUc[key] = method;

            var block = parser.block.parse(fs.readFileSync(codePath, 'utf8'), lang);


            for (var l in block.tree.children) {
                var cls = block.tree.children[l];


                if (cls.type == "class" && cls.name == method.className) {
                    for (var n in cls.children) {
                        var methodC = cls.children[n];

                        if (methodC.type == "method" && methodC.name == method.methodName) {


                            r+="## "+codePath.replace(/^(\/home\/dash\/Projects\/berta\/example\/implementation\/)/, "")+"\n\n```"+lang+"\n"+cls.start_statement+"\n\t"+methodC.body+"\n"+cls.end_statement+"\n```\n";

                        }
                    }
                }
            }

        }


    }


    console.log('saving to ', out+"/"+ucCamelCaseName+".md");
    fs.writeFileSync(out+"/"+ucCamelCaseName+".md", r, "utf-8")



}



