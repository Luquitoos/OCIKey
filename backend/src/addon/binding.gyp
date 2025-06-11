{
  "targets": [
    {
      "target_name": "leitoraddon",
      "sources": [
        "addon.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "../../biblioteca"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "libraries": [
        "<(module_root_dir)/../../biblioteca/libleitor.so",
        "<(module_root_dir)/../../biblioteca/libraylib.so.550",
        "<(module_root_dir)/../../biblioteca/libZXing.so.3"
      ],
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
      "conditions": [
        ["OS=='linux'", {
          "libraries": [
            "-Wl,-rpath,<(module_root_dir)/../../biblioteca"
          ]
        }]
      ]
    }
  ]
}