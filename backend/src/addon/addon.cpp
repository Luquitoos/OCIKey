#include <napi.h>
#include "../../biblioteca/leitor.h"

// Função para ler gabarito a partir do caminho da imagem
Napi::Value ReadImagePath(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    // Verifica se foi passado um argumento
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Esperado um string com o caminho da imagem").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    // Converte o argumento JavaScript para string C
    std::string path = info[0].As<Napi::String>().Utf8Value();
    
    // Chama a função da biblioteca
    Reading result = read_image_path(path.c_str());
    
    // Converte o struct Reading para objeto JavaScript
    Napi::Object jsResult = Napi::Object::New(env);
    jsResult.Set("erro", Napi::Number::New(env, result.erro));
    jsResult.Set("id_prova", Napi::Number::New(env, result.id_prova));
    jsResult.Set("id_participante", Napi::Number::New(env, result.id_participante));
    
    if (result.leitura != nullptr) {
        jsResult.Set("leitura", Napi::String::New(env, result.leitura));
    } else {
        jsResult.Set("leitura", env.Null());
    }
    
    return jsResult;
}

// Função para ler gabarito a partir dos dados da imagem
Napi::Value ReadImageData(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    // Verifica se foram passados os argumentos necessários
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsBuffer()) {
        Napi::TypeError::New(env, "Esperado: extensão da imagem (string) e dados da imagem (buffer)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    // Converte os argumentos JavaScript
    std::string fileType = info[0].As<Napi::String>().Utf8Value();
    Napi::Buffer<unsigned char> buffer = info[1].As<Napi::Buffer<unsigned char>>();
    
    // Chama a função da biblioteca
    Reading result = read_image_data(fileType.c_str(), buffer.Data(), buffer.Length());
    
    // Converte o struct Reading para objeto JavaScript
    Napi::Object jsResult = Napi::Object::New(env);
    jsResult.Set("erro", Napi::Number::New(env, result.erro));
    jsResult.Set("id_prova", Napi::Number::New(env, result.id_prova));
    jsResult.Set("id_participante", Napi::Number::New(env, result.id_participante));
    
    if (result.leitura != nullptr) {
        jsResult.Set("leitura", Napi::String::New(env, result.leitura));
    } else {
        jsResult.Set("leitura", env.Null());
    }
    
    return jsResult;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("readImagePath", Napi::Function::New(env, ReadImagePath));
    exports.Set("readImageData", Napi::Function::New(env, ReadImageData));
    return exports;
}

NODE_API_MODULE(leitoraddon, Init)