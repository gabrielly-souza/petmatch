# app.py

import os
from flask import Flask, request, jsonify, send_from_directory # send_from_directory adicionado aqui
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
# Adicione 'json' aqui se não estiver importado para json.dumps/loads
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, decode_token, get_jwt
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError, DecodeError, InvalidSignatureError, InvalidAudienceError, InvalidIssuerError
from dotenv import load_dotenv
import google.generativeai as genai
import json # Garanta que 'json' está importado
from datetime import timedelta
import traceback
from werkzeug.utils import secure_filename 

# 1. CARREGAR VARIÁVEIS DE AMBIENTE
load_dotenv()

# 2. CRIAR A INSTÂNCIA DO FLASK APP
app = Flask(__name__)

# 3. CONFIGURAÇÕES DO APP (CORS, DB, SECRET_KEY, JWT, BCrypt, Gemini)
CORS(app, resources={r"/api/*": {
    "origins": "http://localhost:3000",
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "headers": ["Content-Type", "Authorization"]
}})

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:2802@localhost:5433/pet_match_db'
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "8063a830296b5dc210babc3399e32e2b")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "b3fb61ecd8eaa84d224acd18a81b604995649841a9a8a52812ce690148105f35")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

# Com Flask-JWT-Extended v4.x.x, essa configuração deve funcionar corretamente
app.config["JWT_CSRF_ENABLED"] = False

bcrypt = Bcrypt(app)
jwt = JWTManager(app)

print(f"DEBUG FLASK-JWT-EXTENDED: JWT_CSRF_ENABLED = {app.config.get('JWT_CSRF_ENABLED')}")

# Configurações de Upload de Arquivos (MANTIDAS)
UPLOAD_FOLDER = 'uploads' # Pasta para salvar as fotos. Será criada na raiz do projeto Flask.
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 # Limite de 16MB para o arquivo

# ========================================================================
# MANIPULADORES DE ERRO PERSONALIZADOS PARA JWT-EXTENDED (REMOVIDO csrf_token_loader)
# ========================================================================
@jwt.unauthorized_loader
def unauthorized_response(callback):
    return jsonify({"message": "Token de autenticação ausente ou inválido."}), 401

@jwt.invalid_token_loader
def invalid_token_response(callback):
    return jsonify({"message": "Token inválido."}), 401

@jwt.expired_token_loader
def expired_token_response(callback):
    return jsonify({"message": "Token expirado."}), 401

@jwt.revoked_token_loader
def revoked_token_response(callback):
    return jsonify({"message": "Token revogado."}), 401

# ========================================================================

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("A variável de ambiente GOOGLE_API_KEY não está definida. Verifique seu arquivo .env.")
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash-latest')

# 4. DEFINIÇÃO DOS MODELOS (CLASSES PYTHON QUE REPRESENTAM SUAS TABELAS)
class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    senha_hash = db.Column(db.String(255), nullable=False)
    telefone = db.Column(db.String(20))
    endereco = db.Column(db.String(255))
    data_cadastro = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())

class OngProtetor(db.Model):
    __tablename__ = 'ongs_protetores'
    id = db.Column(db.Integer, primary_key=True)
    nome_organizacao = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    senha_hash = db.Column(db.String(255), nullable=False)
    telefone = db.Column(db.String(20))
    endereco = db.Column(db.String(255))
    cnpj_cpf = db.Column(db.String(18), unique=True)
    data_cadastro = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())
    aprovado = db.Column(db.Boolean, default=False)

class Animal(db.Model):
    __tablename__ = 'animais'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    especie = db.Column(db.String(50), nullable=False)
    raca = db.Column(db.String(100))
    porte = db.Column(db.String(50))
    idade_texto = db.Column(db.String(50))
    sexo = db.Column(db.String(10))
    cores = db.Column(db.String(255))
    saude = db.Column(db.String(255))
    descricao = db.Column(db.Text)
    foto_principal_url = db.Column(db.String(255)) # URL da foto principal (MANTIDO)
    status_adocao = db.Column(db.String(50), default='Disponível')
    data_cadastro = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())
    ong_protetor_id = db.Column(db.Integer, db.ForeignKey('ongs_protetores.id'), nullable=False)
    ong_protetor = db.relationship('OngProtetor', backref=db.backref('animais', lazy=True))

class Personalidade(db.Model):
    __tablename__ = 'personalidades'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), unique=True, nullable=False)

class AnimalPersonalidade(db.Model):
    __tablename__ = 'animal_personalidades'
    animal_id = db.Column(db.Integer, db.ForeignKey('animais.id', ondelete='CASCADE'), primary_key=True)
    personalidade_id = db.Column(db.Integer, db.ForeignKey('personalidades.id', ondelete='CASCADE'), primary_key=True)
    animal = db.relationship('Animal', backref=db.backref('personalidades_list', lazy=True))
    personalidade = db.relationship('Personalidade', backref=db.backref('animais_list', lazy=True))

class PreferenciaUsuario(db.Model):
    __tablename__ = 'preferencias_usuario'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    especie_preferida = db.Column(db.String(50))
    porte_preferido = db.Column(db.String(50))
    idade_preferida = db.Column(db.String(50))
    nivel_energia_preferido = db.Column(db.String(50))
    experiencia_anterior = db.Column(db.Text)
    espaco_disponivel = db.Column(db.String(100))
    tempo_disponivel = db.Column(db.String(100))
    data_ultima_atualizacao = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())
    usuario = db.relationship('Usuario', backref=db.backref('preferencias', uselist=False, lazy=True))

class InteracaoChatbot(db.Model):
    __tablename__ = 'interacoes_chatbot'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'))
    sessao_id = db.Column(db.String(255), nullable=False)
    tipo_ator = db.Column(db.String(20), nullable=False)
    mensagem = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())
    usuario = db.relationship('Usuario', backref=db.backref('interacoes_chatbot', lazy=True))


# 5. FUNÇÕES AUXILIARES

# Função auxiliar para verificar tipos de arquivo permitidos (ADICIONADO)
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def buscar_pets_por_criterios_db(especie=None, porte=None, temperamento_keywords=[], energia=None, idade_texto_pref=None):
    query = Animal.query

    if especie:
        query = query.filter(db.func.lower(Animal.especie) == especie.lower())
    if porte:
        query = query.filter(db.func.lower(Animal.porte) == porte.lower())
    
    if idade_texto_pref:
        query = query.filter(db.func.lower(Animal.idade_texto).like(f'%{idade_texto_pref.lower()}%'))

    if temperamento_keywords:
        personality_filter_conditions = []
        for keyword in temperamento_keywords:
            personality_filter_conditions.append(db.func.lower(Personalidade.nome) == keyword.lower())
        
        if personality_filter_conditions:
            query = query.join(AnimalPersonalidade).join(Personalidade).filter(db.or_(*personality_filter_conditions))

    results = query.all()
    
    pets_data = []
    for pet in results:
        personalidades_nomes = [p.personalidade.nome for p in pet.personalidades_list]
        pets_data.append({
            "id": pet.id,
            "nome": pet.nome,
            "especie": pet.especie,
            "raca": pet.raca,
            "idade_texto": pet.idade_texto,
            "porte": pet.porte,
            "sexo": pet.sexo,
            "personalidades": personalidades_nomes,
            "cores": pet.cores,
            "saude": pet.saude,
            "descricao": pet.descricao,
            "foto_principal_url": pet.foto_principal_url,
            "status_adocao": pet.status_adocao,
        })
    return pets_data


# 6. INÍCIO DA SESSÃO DE CHAT COM PROMPT (SE FOR GLOBAL)
chat_sessions = {}

@app.before_request
def setup_chat():
    global chat
    if 'default_chat_session' not in chat_sessions:
        chat_sessions['default_chat_session'] = model.start_chat(history=[{
            "role": "user",
            "parts": ["""Você é um assistente de adoção de pets chamado PetAmigo. Seu objetivo é ajudar usuários a encontrar o pet ideal.

            **Instruções de Formatação (IMPORTANTE):**
            Se o usuário expressar preferências claras para a busca de um pet (espécie, porte, temperamento, energia), me responda COM AS PREFERÊNCIAS NO INÍCIO DA MENSAGEM, EM FORMATO JSON, antes de qualquer texto amigável. Use as chaves 'especie', 'porte', 'temperamento' (lista de strings), 'energia', 'idade'. Se uma preferência não for mencionada ou for desconhecida, omita a chave. Para 'idade', use a string exata fornecida pelo usuário (ex: '3 meses', '2 anos', 'filhote').

            Exemplo de resposta formatada:
            ```json
            {"especie": "Cachorro", "porte": "Médio", "temperamento": ["calmo", "companheiro"], "energia": "Média", "idade": "filhote"}
            ```

            Após o JSON, pode continuar com a resposta amigável e prestativa, como: "Compreendi! Você busca um cachorro de porte médio e calmo. Deixe-me ver o que temos por aqui..."

            
            **Comportamento (Prioridade na Coleta de Preferências):**
            1.  **PRIORIDADE ABSOLUTA: Coletar Preferências Completas.**
                * Sua primeira e principal tarefa é coletar informações completas sobre as preferências do usuário. Isso inclui:
                    * **Detalhes do Pet:** tipo de pet (espécie), porte (pequeno, médio, grande?), temperamento (brincalhão, calmo, independente?), nível de energia (alto, médio, baixo?), idade (filhote, adulto, idoso?) e raça (se houver preferência).
                    * **Detalhes do Ambiente e Estilo de Vida do Usuário:** Se mora em casa ou apartamento, se tem outros animais de estimação, quanto tempo passa fora de casa e se tem crianças em casa.
                * Ao receber uma preferência (ex: "cachorro"), **NUNCA sugira pets imediatamente.**
                * Sempre responda agradecendo a preferência já dada e **IMEDIATAMENTE FAÇA MAIS PERGUNTAS para coletar as preferências restantes que ainda não foram fornecidas.**
                * Você DEVE fazer perguntas sobre as preferências de pet (porte, temperamento, energia, idade, raça) E as perguntas sobre o ambiente e estilo de vida do usuário (mora em casa/apartamento, outros animais, tempo fora, crianças).
                * Continue neste modo de "perguntas adicionais" até que você sinta que coletou um conjunto razoável de critérios (pelo menos 3-4 preferências do pet E 2-3 do ambiente) ou se o usuário expressamente disser "ok, pode procurar agora".

            2.  **Sugestão de Pets (APENAS APÓS COLETAR PREFERÊNCIAS SUFICIENTES OU PEDIDO EXPLÍCITO):**
                * Somente quando você tiver um bom conjunto de preferências do usuário (ex: espécie, porte E temperamento) OU o usuário explicitamente pedir "pode ver o que tem?", você usará os dados dos pets disponíveis (que o backend irá fornecer a você) para sugerir os que mais combinam, destacando suas qualidades. Use também as informações de ambiente para fazer sugestões mais adequadas (ex: "Este pet é ótimo para apartamento" ou "Ele se daria bem com crianças").
                * Se nenhum pet combinar com os critérios, diga que não há pets disponíveis para aquelas preferências e ofereça para refinar a busca ou procurar por outros critérios.
                * Responda sempre de forma amigável e útil.
            """]
        }])
    chat = chat_sessions['default_chat_session']


# 7. ROTAS FLASK
@app.route('/api/animals/<int:animal_id>', methods=['GET'])
def get_animal_details(animal_id):
    try:
        animal = Animal.query.get(animal_id)
        
        if not animal:
            return jsonify({"message": "Animal não encontrado."}), 404
        
        # Coleta as personalidades do animal, assim como você faz em get_animals
        personalidades_nomes = []
        for ap in animal.personalidades_list:
            if ap.personalidade:
                personalidades_nomes.append(ap.personalidade.nome)

        animal_data = {
            "id": animal.id,
            "nome": animal.nome,
            "especie": animal.especie,
            "raca": animal.raca,
            "porte": animal.porte,
            "idade_texto": animal.idade_texto,
            "sexo": animal.sexo,
            "cores": animal.cores,
            "saude": animal.saude,
            "descricao": animal.descricao,
            "foto_principal_url": animal.foto_principal_url,
            "status_adocao": animal.status_adocao,
            "ong_protetor_id": animal.ong_protetor_id,
            "personalidades": personalidades_nomes
        }
        return jsonify(animal_data), 200

    except Exception as e:
        print(f"ERRO ao buscar detalhes do animal {animal_id}: {str(e)}")
        traceback.print_exc()
        return jsonify({"message": f"Erro ao buscar detalhes do animal: {str(e)}"}), 500

# --- Rotas de Autenticação ---
@app.route('/api/register/usuario', methods=['POST'])
def register_user():
    data = request.get_json()
    email = data.get('email')
    senha = data.get('senha')
    nome = data.get('nome')
    telefone = data.get('telefone')
    endereco = data.get('endereco')
    
    # NOVOS CAMPOS para ONG/Protetor
    nome_organizacao = data.get('nome_organizacao')
    cnpj_cpf = data.get('cnpj_cpf') # Pode ser CNPJ para ONG ou CPF para protetor individual

    if not email or not senha:
        return jsonify({"message": "Email e senha são obrigatórios."}), 400

    # Determina o tipo de registro (usuário ou ONG/Protetor)
    if nome_organizacao and cnpj_cpf:
        # Tenta registrar como ONG/Protetor
        if OngProtetor.query.filter_by(email=email).first():
            return jsonify({"message": "Email já registrado para ONG/Protetor."}), 409

        hashed_password = bcrypt.generate_password_hash(senha).decode('utf-8')
        new_ong = OngProtetor(
            nome_organizacao=nome_organizacao,
            email=email,
            senha_hash=hashed_password,
            telefone=telefone,
            endereco=endereco,
            cnpj_cpf=cnpj_cpf,
            aprovado=False # Por padrão, ONGs precisam de aprovação (depois um admin aprovaria)
        )
        db.session.add(new_ong)
        db.session.commit()
        return jsonify({"message": "ONG/Protetor registrado com sucesso! Aguardando aprovação.", "role": "ong_protetor"}), 201
    else:
        # Tenta registrar como Usuário normal
        if Usuario.query.filter_by(email=email).first():
            return jsonify({"message": "Email já registrado para usuário."}), 409
        
        if not nome: # Nome é obrigatório para usuário normal
            return jsonify({"message": "Nome é obrigatório para registro de usuário."}), 400

        hashed_password = bcrypt.generate_password_hash(senha).decode('utf-8')
        new_user = Usuario(
            nome=nome,
            email=email,
            senha_hash=hashed_password,
            telefone=telefone,
            endereco=endereco
        )
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "Usuário registrado com sucesso!", "role": "usuario"}), 201

@app.route('/api/login/usuario', methods=['POST'])
def login_user():
    data = request.get_json()
    email = data.get('email')
    senha = data.get('senha')

    if not email or not senha:
        return jsonify({"message": "Email e senha são obrigatórios."}), 400

    # Tenta logar como usuário normal
    user = Usuario.query.filter_by(email=email).first()
    if user and bcrypt.check_password_hash(user.senha_hash, senha):
        # identity={'id': user.id, 'role': 'usuario'} se torna string JSON
        access_token = create_access_token(identity=json.dumps({'id': user.id, 'role': 'usuario'}))
        print(f"DEBUG LOGIN (USUARIO): Token para usuário: {access_token[:60]}...")
        return jsonify(access_token=access_token, message="Login de usuário bem-sucedido!", role="usuario"), 200

    # Tenta logar como ONG/Protetor
    ong_protetor = OngProtetor.query.filter_by(email=email).first()
    if ong_protetor and bcrypt.check_password_hash(ong_protetor.senha_hash, senha):
        if not ong_protetor.aprovado:
            return jsonify({"message": "Sua conta de ONG/Protetor ainda não foi aprovada."}), 403
        
        expires = timedelta(hours=24)
        
        print(f"DEBUG LOGIN (ONG): JWT_CSRF_ENABLED ANTES DE CRIAR TOKEN: {app.config.get('JWT_CSRF_ENABLED')}")

        # identity={'id': ong_protetor.id, 'role': 'ong_protetor'} se torna string JSON
        access_token = create_access_token(
            identity=json.dumps({'id': ong_protetor.id, 'role': 'ong_protetor'}),
            expires_delta=expires
        )
        
        # Verifique se o token final NÃO TEM CSRF (apenas para depuração)
        try:
            # decode_token espera o 'sub' como string, então isso deve funcionar agora
            decoded_token_check = decode_token(access_token)
            if 'csrf' in decoded_token_check:
                print("ERRO INESPERADO: 'csrf' AINDA PRESENTE no token após create_access_token, mesmo com JWT_CSRF_ENABLED=False (v4.x.x).")
            else:
                print("SUCESSO: Token gerado LIMPO de 'csrf' (v4.x.x).")
            print(f"DEBUG LOGIN (ONG): Claims do TOKEN FINAL DECODIFICADO (APÓS GERAÇÃO): {decoded_token_check}")
        except Exception as e:
            print(f"ERRO DEBUG: Falha ao decodificar token final para inspeção (após upgrade e mudança de identity): {e}")
            traceback.print_exc()

        print(f"DEBUG LOGIN (ONG): TOKEN SENDO ENVIADO AO FRONTEND (APÓS UPGRADE E MUDANÇA DE IDENTITY): {access_token[:60]}...")
        return jsonify(access_token=access_token, message="Login de ONG/Protetor bem-sucedido!", role="ong_protetor"), 200
        
    return jsonify({"message": "Email ou senha inválidos."}), 401

# --- Rota da API de Chatbot ---
@app.route('/api/chat', methods=['POST'])
def chat_endpoint():
    data = request.get_json()
    user_message = data.get('message')
    if not user_message:
        return jsonify({'error': 'Mensagem do usuário não fornecida'}), 400

    try:
        response = chat.send_message(user_message)
        ia_resposta = response.text

        print(f"\n--- Depuração da IA ---")
        print(f"Mensagem do usuário: {user_message}")
        print(f"Resposta COMPLETA da IA: \n{ia_resposta}\n")

        preferencias_json = {}
        try:
            if '```json' in ia_resposta and '```' in ia_resposta:
                json_start = ia_resposta.find('```json') + len('```json')
                json_end = ia_resposta.find('```', json_start)
                json_str = ia_resposta[json_start:json_end].strip()
                preferencias_json = json.loads(json_str)
                print(f"DEBUG: JSON extraído com sucesso: {preferencias_json}")
            else:
                print("DEBUG: Nenhum bloco JSON encontrado na resposta da IA.")

        except json.JSONDecodeError as e:
            print(f"ERRO DEBUG: Não foi possível decodificar JSON da IA: {e}")

        especie_desejada = preferencias_json.get("especie")
        porte_desejado = preferencias_json.get("porte")
        personalidade_keywords = preferencias_json.get("temperamento", [])
        energia_desejada = preferencias_json.get("energia")
        idade_desejada = preferencias_json.get("idade")
        # Garante que a string de personalidades seja definida antes de ser usada no f-string maior.
        personalidades_formatadas = ', '.join(personalidade_keywords) if personalidade_keywords else 'Não especificado'
        print(f"Preferências finais para busca: Espécie={especie_desejada}, Porte={porte_desejado}, Personalidade={personalidade_keywords}, Energia={energia_desejada}, Idade={idade_desejada}")
        print(f"--- Fim Depuração da IA ---\n")

        pets_encontrados = []
        with app.app_context():
            pets_encontrados = buscar_pets_por_criterios_db(
                especie=especie_desejada,
                porte=porte_desejado,
                temperamento_keywords=personalidade_keywords,
                energia=energia_desejada,
                idade_texto_pref=idade_desejada
            )

        if pets_encontrados:
            pets_json_str = json.dumps(pets_encontrados, indent=2, ensure_ascii=False)

            prompt_para_sugestao = f"""
            O usuário está procurando um pet. Com base na nossa conversa, ele/ela tem as seguintes preferências:
            Espécie: {especie_desejada if especie_desejada else 'Não especificado'}
            Porte: {porte_desejado if porte_desejado else 'Não especificado'}
            Personalidade: {personalidades_formatadas}
            Nível de energia: {energia_desejada if energia_desejada else 'Não especificado'}
            Idade: {idade_desejada if idade_desejada else 'Não especificado'}

            Encontrei os seguintes pets que podem combinar (dados em JSON):
            {pets_json_str}

            Por favor, formule uma sugestão amigável e personalizada para o usuário. Apresente 1 ou 2 pets que mais combinam, destacando suas qualidades e como eles se encaixam nas preferências. Peça para o usuário dizer o nome do pet se quiser saber mais detalhes. Se houver muitos, diga que há muitas opções e peça para refinar a busca. Mantenha um tom prestativo de assistente de adoção.
            **NÃO inclua nenhum bloco de código JSON nesta resposta final ao usuário.** """
            
            response_sugestao = chat.send_message(prompt_para_sugestao)
            final_response = response_sugestao.text
            return jsonify({'response': final_response})
        else:
            final_response = "Desculpe, não encontramos nenhum pet que corresponda a todas as suas preferências no momento. Gostaria de tentar refinar sua busca ou procurar por outro tipo de pet?"
            return jsonify({'response': final_response})

    except Exception as e:
        print(f"Erro ao chamar a API Gemini ou processar: {e}")
        return jsonify({'error': f'Erro ao processar a mensagem: {str(e)}. Verifique o log do servidor.'}), 500

# --- Rotas de Gerenciamento de Animais ---
@app.route('/api/animals', methods=['GET'])
def get_animals():
    try:
        animals = Animal.query.filter_by(status_adocao='Disponível').all()
        animals_data = []
        for animal in animals:
            # Garanta que personalidades_nomes está coletando os nomes corretamente
            personalidades_nomes = []
            # animal.personalidades_list é a backref que criamos em AnimalPersonalidade
            # e ela contém objetos AnimalPersonalidade.
            # Cada objeto AnimalPersonalidade tem uma relação com 'personalidade'.
            for ap in animal.personalidades_list:
                if ap.personalidade: # Verifica se a personalidade existe
                    personalidades_nomes.append(ap.personalidade.nome)

            animals_data.append({
                "id": animal.id,
                "nome": animal.nome,
                "especie": animal.especie,
                "raca": animal.raca,
                "porte": animal.porte,
                "idade_texto": animal.idade_texto,
                "sexo": animal.sexo,
                "cores": animal.cores,
                "saude": animal.saude,
                "descricao": animal.descricao,
                "foto_principal_url": animal.foto_principal_url,
                "status_adocao": animal.status_adocao,
                "ong_protetor_id": animal.ong_protetor_id,
                "personalidades": personalidades_nomes # <-- Certifique-se de que esta linha está correta
            })
        return jsonify(animals_data), 200
    except Exception as e:
        print(f"ERRO ao buscar animais: {str(e)}")
        traceback.print_exc()
        return jsonify({"message": f"Erro ao buscar animais: {str(e)}"}), 500

@app.route('/api/animals', methods=['POST'])
@jwt_required()
def create_animal():
    try:
        # Pega os claims brutos do token para depuração
        claims = get_jwt()
        print("DEBUG: Claims do token JWT (get_jwt()):", claims)
        # Se 'csrf' ainda aparece aqui, é um mistério e vamos tentar debuggar
        if 'csrf' in claims:
            print("AVISO CRÍTICO: 'csrf' claim ENCONTRADO no token, mesmo após o upgrade. Isso é MUITO INESPERADO.")
            # Nao retornamos mais 422 por isso, pois agora JWT_CSRF_ENABLED=False deve estar funcionando

        # IMPORTANTE: get_jwt_identity() AGORA RETORNA UMA STRING JSON, PRECISA DO json.loads()
        current_user_identity_str = get_jwt_identity()
        current_user_identity = json.loads(current_user_identity_str)

        print("DEBUG: current_user_identity recebido (parsed):", current_user_identity)
        
        if current_user_identity is None:
            print("DEBUG: current_user_identity é None. Token pode estar inválido ou faltando identidade.")
            return jsonify({"message": "Token JWT inválido ou identidade faltando."}), 401

        user_id = current_user_identity.get('id')
        user_role = current_user_identity.get('role')
        print(f"DEBUG: user_id: {user_id}, user_role: {user_role}")

        # Apenas ONGs/Protetores podem cadastrar animais
        if user_role != 'ong_protetor':
            print(f"DEBUG: Tentativa de cadastro por role inválido: {user_role}")
            return jsonify({"message": "Apenas ONGs/Protetores podem cadastrar animais."}), 403

        # Validação da ONG/Protetor (agora deve passar)
        ong_protetor = OngProtetor.query.get(user_id)
        if not ong_protetor or not ong_protetor.aprovado:
            print(f"DEBUG: ONG/Protetor (ID: {user_id}) não encontrada ou não aprovada.")
            return jsonify({"message": "ONG/Protetor não encontrado ou não aprovado."}), 403

        # AQUI COMEÇA O TRATAMENTO DE FormData para upload e dados
        # O frontend deve enviar os dados como FormData, não como JSON.
        # request.form para campos de texto, request.files para arquivos.
        
        # Lida com o upload do arquivo
        foto_url = None
        file_path = None # Para garantir que file_path esteja definido para remoção em caso de erro
        
        if 'foto_principal' in request.files:
            file = request.files['foto_principal']
            if file.filename != '':
                if file and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    # Cria a pasta de uploads se ela não existir
                    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file.save(file_path)
                    # A URL que o frontend usará para exibir a imagem
                    foto_url = f"http://localhost:5000/uploads/{filename}" # AJUSTE ISSO SE SEU BACKEND RODAR EM OUTRO ENDEREÇO/PORTA
                else:
                    return jsonify({"message": "Tipo de arquivo não permitido ou erro no upload."}), 400
            else:
                return jsonify({"message": "Nenhum arquivo selecionado para foto principal."}), 400
        else:
            return jsonify({"message": "Campo 'foto_principal' ausente no formulário."}), 400


        # Coleta os outros dados do formulário enviados via FormData (request.form)
        nome = request.form.get('nome')
        especie = request.form.get('especie')
        raca = request.form.get('raca')
        porte = request.form.get('porte')
        idade_texto = request.form.get('idade_texto')
        sexo = request.form.get('sexo')
        cores = request.form.get('cores')
        saude = request.form.get('saude')
        # getlist() para pegar múltiplos valores de checkboxes, por exemplo
        personalidades_nomes = request.form.getlist('personalidades[]') # O nome do campo pode variar (e.g., 'personalidades' ou 'personalidades[]')
        descricao = request.form.get('descricao')
        status_adocao = request.form.get('status_adocao', 'Disponível')

        print("DEBUG: Dados recebidos do formulário:", {
            "nome": nome, "especie": especie, "raca": raca, "porte": porte,
            "idade_texto": idade_texto, "sexo": sexo, "cores": cores,
            "saude": saude, "personalidades": personalidades_nomes,
            "descricao": descricao, "foto_url": foto_url, "status": status_adocao
        })

        # Validações básicas dos dados do animal
        required_fields = ["nome", "especie", "porte", "idade_texto", "sexo", "descricao"]
        for field in required_fields:
            if not locals()[field]: # Verifica se a variável local correspondente ao campo está vazia
                # Se algum campo obrigatório estiver faltando, remove o arquivo salvo
                if file_path and os.path.exists(file_path):
                    os.remove(file_path)
                return jsonify({"message": f"Campo '{field}' é obrigatório."}), 400

        personalidades_objetos = []
        for p_nome in personalidades_nomes:
            personalidade_db = Personalidade.query.filter_by(nome=p_nome).first()
            if personalidade_db:
                personalidades_objetos.append(personalidade_db)
            else:
                print(f"AVISO: Personalidade '{p_nome}' não encontrada no banco de dados. Ignorando ou considere adicionar.")
                # Opcional: retornar erro ou criar a personalidade aqui

        novo_animal = Animal(
            nome=nome,
            especie=especie,
            raca=raca,
            porte=porte,
            idade_texto=idade_texto,
            sexo=sexo,
            cores=cores,
            saude=saude,
            descricao=descricao,
            foto_principal_url=foto_url, # Usa a URL da foto salva
            status_adocao=status_adocao,
            ong_protetor_id=user_id # Usa o ID da ONG do token JWT
        )

        db.session.add(novo_animal)
        db.session.commit() # Commit para que novo_animal.id seja gerado

        # Associa personalidades ao animal
        for pers_obj in personalidades_objetos:
            animal_personalidade = AnimalPersonalidade(animal=novo_animal, personalidade=pers_obj)
            db.session.add(animal_personalidade)
        
        db.session.commit() # Commit das associações de personalidades

        return jsonify({"message": "Animal cadastrado com sucesso!", "animal_id": novo_animal.id}), 201
    except InvalidTokenError as e:
        print(f"ERRO JWT (InvalidTokenError): {str(e)}")
        # Se houve um erro no token e um arquivo foi salvo, remova-o
        if 'file_path' in locals() and file_path and os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({"message": f"Token JWT inválido: {str(e)}"}), 401
    except ExpiredSignatureError:
        print("ERRO JWT: Token expirado.")
        if 'file_path' in locals() and file_path and os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({"message": "Token JWT expirado. Faça login novamente."}), 401
    except (DecodeError, InvalidSignatureError, InvalidAudienceError, InvalidIssuerError) as e:
        print(f"ERRO JWT (Decodificação/Assinatura): {str(e)}")
        if 'file_path' in locals() and file_path and os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({"message": f"Erro de decodificação ou assinatura do token: {str(e)}"}), 401
    except Exception as e:
        db.session.rollback()
        print(f"ERRO CRÍTICO ao cadastrar animal (Geral): {str(e)}")
        traceback.print_exc()
        # Em caso de erro geral, remova o arquivo salvo
        if 'file_path' in locals() and file_path and os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({"message": f"Erro interno do servidor ao cadastrar animal: {str(e)}"}), 500

@app.route('/api/animals/<int:animal_id>', methods=['PUT'])
@jwt_required()
def update_animal(animal_id):
    try:
        current_user_identity_str = get_jwt_identity()
        current_user_identity = json.loads(current_user_identity_str)
        user_id = current_user_identity.get('id')
        user_role = current_user_identity.get('role')

        # 1. Apenas ONGs/Protetores podem editar animais
        if user_role != 'ong_protetor':
            return jsonify({"message": "Apenas ONGs/Protetores podem editar animais."}), 403

        # 2. Busca o animal pelo ID
        animal = Animal.query.get(animal_id)
        if not animal:
            return jsonify({"message": "Animal não encontrado."}), 404

        # 3. Verifica se a ONG/Protetor logada é a dona do animal
        if animal.ong_protetor_id != user_id:
            return jsonify({"message": "Você não tem permissão para editar este animal."}), 403

        # Dados podem vir de FormData (se inclui arquivo) ou JSON (se não inclui arquivo)
        is_multipart_form = request.content_type and 'multipart/form-data' in request.content_type

        # Lida com o upload do arquivo se houver (ADICIONADO/MODIFICADO)
        foto_url = animal.foto_principal_url # Mantém a URL existente por padrão
        file_path = None # Para controle de remoção em caso de erro

        if 'foto_principal' in request.files: # Se um novo arquivo foi enviado
            file = request.files['foto_principal']
            if file.filename != '':
                if allowed_file(file.filename):
                    # Se há uma foto antiga, tente removê-la para não acumular lixo
                    if animal.foto_principal_url:
                        old_filename = os.path.basename(animal.foto_principal_url)
                        old_file_path = os.path.join(app.config['UPLOAD_FOLDER'], old_filename)
                        if os.path.exists(old_file_path):
                            os.remove(old_file_path)
                            print(f"DEBUG: Foto antiga removida: {old_file_path}")
                    
                    filename = secure_filename(file.filename)
                    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file.save(file_path)
                    foto_url = f"http://localhost:5000/uploads/{filename}" # AJUSTE ISSO SE SEU BACKEND RODAR EM OUTRO ENDEREÇO/PORTA
                else:
                    return jsonify({"message": "Tipo de arquivo não permitido para foto principal."}), 400
            # Se o campo 'foto_principal' está no request.files, mas o filename está vazio,
            # significa que o usuário talvez queira remover a foto.
            # Você pode adicionar uma lógica aqui para definir foto_url como None se for o caso.
            # Ex: elif file.filename == '' and 'clear_foto' in request.form: foto_url = None
        
        # Coleta os outros dados. Se for multipart/form-data, use request.form. Senão, request.get_json().
        if is_multipart_form:
            data = request.form
            personalidades_nomes = request.form.getlist('personalidades[]')
        else:
            data = request.get_json()
            personalidades_nomes = data.get('personalidades', [])


        # 4. Atualiza os campos do animal
        animal.nome = data.get('nome', animal.nome)
        animal.especie = data.get('especie', animal.especie)
        animal.raca = data.get('raca', animal.raca)
        animal.porte = data.get('porte', animal.porte)
        animal.idade_texto = data.get('idade_texto', animal.idade_texto)
        animal.sexo = data.get('sexo', animal.sexo)
        animal.cores = data.get('cores', animal.cores)
        animal.saude = data.get('saude', animal.saude)
        animal.descricao = data.get('descricao', animal.descricao)
        animal.foto_principal_url = foto_url # Atualiza a URL da foto (pode ser a nova ou a antiga)
        animal.status_adocao = data.get('status_adocao', animal.status_adocao)

        # 5. Atualiza as personalidades (maneira mais robusta: deleta tudo e recria)
        
        # Remove todas as personalidades existentes para este animal
        AnimalPersonalidade.query.filter_by(animal_id=animal.id).delete()
        db.session.commit() # Commit para efetivar a exclusão antes de adicionar novos

        # Adiciona as novas personalidades
        personalidades_objetos = []
        for p_name in personalidades_nomes:
            personalidade_db = Personalidade.query.filter_by(nome=p_name).first()
            if personalidade_db:
                personalidades_objetos.append(personalidade_db)
            else:
                print(f"AVISO: Personalidade '{p_name}' não encontrada no banco de dados. Ignorando ou considere criar.")
                # Opcional: criar personalidade se não existir, ou retornar erro
        
        for pers_obj in personalidades_objetos:
            animal_personalidade = AnimalPersonalidade(animal=animal, personalidade=pers_obj)
            db.session.add(animal_personalidade)
            
        db.session.commit() # Commit das associações de personalidades e atualização do animal

        return jsonify({"message": "Animal atualizado com sucesso!"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"ERRO CRÍTICO ao atualizar animal (Geral): {str(e)}")
        traceback.print_exc()
        # Em caso de erro, se uma nova foto foi salva, tente removê-la
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({"message": f"Erro interno do servidor ao atualizar animal: {str(e)}"}), 500

@app.route('/api/animals/<int:animal_id>', methods=['DELETE'])
@jwt_required()
def delete_animal(animal_id):
    try:
        current_user_identity_str = get_jwt_identity()
        current_user_identity = json.loads(current_user_identity_str)
        user_id = current_user_identity.get('id')
        user_role = current_user_identity.get('role')

        if user_role != 'ong_protetor':
            return jsonify({"message": "Apenas ONGs/Protetores podem deletar animais."}), 403

        animal = Animal.query.get(animal_id)
        if not animal:
            return jsonify({"message": "Animal não encontrado."}), 404

        if animal.ong_protetor_id != user_id:
            return jsonify({"message": "Você não tem permissão para deletar este animal."}), 403
        
        # Opcional: remover a foto do sistema de arquivos antes de deletar o registro do BD
        if animal.foto_principal_url:
            filename = os.path.basename(animal.foto_principal_url)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"DEBUG: Foto do animal {animal.id} removida do disco: {file_path}")

        db.session.delete(animal)
        db.session.commit()
        return jsonify({"message": "Animal deletado com sucesso!"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"ERRO ao deletar animal: {str(e)}")
        traceback.print_exc()
        return jsonify({"message": f"Erro interno do servidor ao deletar animal: {str(e)}"}), 500

# Rota para obter animais de uma ONG/Protetor específica (protegida por JWT)
@app.route('/api/my-animals', methods=['GET'])
@jwt_required()
def get_my_animals():
    try:
        current_user_identity_str = get_jwt_identity()
        current_user_identity = json.loads(current_user_identity_str)
        user_id = current_user_identity.get('id')
        user_role = current_user_identity.get('role')

        if user_role != 'ong_protetor':
            return jsonify({"message": "Apenas ONGs/Protetores podem acessar esta rota."}), 403

        # Busca animais que pertencem à ONG/Protetor logada
        my_animals = Animal.query.filter_by(ong_protetor_id=user_id).all()
        animals_data = []
        for animal in my_animals:
            personalidades_nomes = [p.personalidade.nome for p in animal.personalidades_list if p.personalidade]
            animals_data.append({
                "id": animal.id,
                "nome": animal.nome,
                "especie": animal.especie,
                "raca": animal.raca,
                "porte": animal.porte,
                "idade_texto": animal.idade_texto,
                "sexo": animal.sexo,
                "cores": animal.cores,
                "saude": animal.saude,
                "descricao": animal.descricao,
                "foto_principal_url": animal.foto_principal_url,
                "status_adocao": animal.status_adocao,
                "ong_protetor_id": animal.ong_protetor_id,
                "personalidades": personalidades_nomes
            })
        return jsonify(animals_data), 200
    except Exception as e:
        print(f"ERRO ao buscar 'meus' animais: {str(e)}")
        traceback.print_exc()
        return jsonify({"message": f"Erro interno do servidor ao buscar 'meus' animais: {str(e)}"}), 500

# Rota para servir arquivos estáticos da pasta 'uploads' (ADICIONADO)
# IMPORTANTE: Esta rota é adequada APENAS PARA DESENVOLVIMENTO.
# Em produção, você deve configurar um servidor web dedicado (ex: Nginx, Apache) ou um serviço de
# armazenamento de objetos (ex: AWS S3, Google Cloud Storage) para servir arquivos estáticos de forma eficiente e segura.
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# 8. INICIAR O SERVIDOR FLASK
if __name__ == '__main__':
    # Garante que o diretório de uploads exista ao iniciar o aplicativo (ADICIONADO)
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
        
    with app.app_context():
        db.create_all() # Garante que as tabelas sejam criadas se não existirem
        # Opcional: Adicionar personalidades padrão se a tabela estiver vazia
        if not Personalidade.query.first():
            personalidades_padrao = [
                "Brincalhão", "Calmo", "Independente", "Sociável",
                "Curioso", "Carente", "Protetor", "Tímido",
                "Dócil", "Energético", "Inteligente", "Leal",
                "Paciente", "Obediente", "Corajoso", "Cres",
                "Territorial", "Amigável", "Adaptável"
            ]
            for p_nome in personalidades_padrao:
                db.session.add(Personalidade(nome=p_nome))
            db.session.commit()
            print("Personalidades padrão adicionadas ao banco de dados.")
    app.run(debug=True) # Modo de depuração para desenvolvimento