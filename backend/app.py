import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, decode_token, get_jwt
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError, DecodeError, InvalidSignatureError, InvalidAudienceError, InvalidIssuerError
from dotenv import load_dotenv
import google.generativeai as genai
import json
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

# ========================================================================
# MANIPULADORES DE ERRO PERSONALIZADOS PARA JWT-EXTENDED
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

# Configurações de Upload de Arquivos
UPLOAD_FOLDER = 'uploads' # Pasta para salvar as fotos. Será criada na raiz do projeto Flask.
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 # Limite de 16MB para o arquivo

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
    foto_principal_url = db.Column(db.String(255))
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

# --- Rota para buscar informações de contato da ONG/Protetor ---
@app.route('/api/ong-protetor/<int:ong_protetor_id>/contact', methods=['GET'])
# Removi o @jwt_required() para permitir acesso público, mas você pode adicionar de volta se precisar.
def get_ong_protetor_contact(ong_protetor_id):
    try:
        ong_protetor = OngProtetor.query.get(ong_protetor_id)
        
        if not ong_protetor:
            return jsonify({"message": "ONG/Protetor não encontrado."}), 404

        contact_data = {
            "id": ong_protetor.id,
            "nome_organizacao": ong_protetor.nome_organizacao, # Usando nome_organizacao para ONG/Protetor
            "email": ong_protetor.email,
            "telefone": ong_protetor.telefone,
            "endereco": ong_protetor.endereco,
        }
        return jsonify(contact_data), 200

    except Exception as e:
        print(f"ERRO ao buscar contato da ONG/Protetor {ong_protetor_id}: {str(e)}")
        traceback.print_exc()
        return jsonify({"message": f"Erro ao buscar informações de contato: {str(e)}"}), 500


@app.route('/api/animals/<int:animal_id>', methods=['GET'])
def get_animal_details(animal_id):
    try:
        animal = Animal.query.get(animal_id)
        
        if not animal:
            return jsonify({"message": "Animal não encontrado."}), 404
        
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
            "ong_protetor_id": animal.ong_protetor_id, # ESSENCIAL PARA O FRONTEND
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
    
    nome_organizacao = data.get('nome_organizacao')
    cnpj_cpf = data.get('cnpj_cpf')

    if not email or not senha:
        return jsonify({"message": "Email e senha são obrigatórios."}), 400

    if nome_organizacao and cnpj_cpf:
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
            aprovado=False
        )
        db.session.add(new_ong)
        db.session.commit()
        return jsonify({"message": "ONG/Protetor registrado com sucesso! Aguardando aprovação.", "role": "ong_protetor"}), 201
    else:
        if Usuario.query.filter_by(email=email).first():
            return jsonify({"message": "Email já registrado para usuário."}), 409
        
        if not nome:
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

    user = Usuario.query.filter_by(email=email).first()
    if user and bcrypt.check_password_hash(user.senha_hash, senha):
        access_token = create_access_token(identity=json.dumps({'id': user.id, 'role': 'usuario'}))
        return jsonify(access_token=access_token, message="Login de usuário bem-sucedido!", role="usuario"), 200

    ong_protetor = OngProtetor.query.filter_by(email=email).first()
    if ong_protetor and bcrypt.check_password_hash(ong_protetor.senha_hash, senha):
        if not ong_protetor.aprovado:
            return jsonify({"message": "Sua conta de ONG/Protetor ainda não foi aprovada."}), 403
        
        expires = timedelta(hours=24)
        
        access_token = create_access_token(
            identity=json.dumps({'id': ong_protetor.id, 'role': 'ong_protetor'}),
            expires_delta=expires
        )
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

        preferencias_json = {}
        try:
            if '```json' in ia_resposta and '```' in ia_resposta:
                json_start = ia_resposta.find('```json') + len('```json')
                json_end = ia_resposta.find('```', json_start)
                json_str = ia_resposta[json_start:json_end].strip()
                preferencias_json = json.loads(json_str)
        except json.JSONDecodeError:
            pass # Ignora erros de JSON se não for um JSON válido

        especie_desejada = preferencias_json.get("especie")
        porte_desejado = preferencias_json.get("porte")
        personalidade_keywords = preferencias_json.get("temperamento", [])
        energia_desejada = preferencias_json.get("energia")
        idade_desejada = preferencias_json.get("idade")
        personalidades_formatadas = ', '.join(personalidade_keywords) if personalidade_keywords else 'Não especificado'

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
            personalidades_nomes = []
            for ap in animal.personalidades_list:
                if ap.personalidade:
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
                "personalidades": personalidades_nomes
            })
        return jsonify(animals_data), 200
    except Exception as e:
        print(f"ERRO ao buscar animais: {str(e)}")
        traceback.print_exc()
        return jsonify({"message": f"Erro ao buscar animais: {str(e)}"}), 500

@app.route('/api/animals', methods=['POST'])
@jwt_required()
def create_animal():
    file_path = None # Inicializa para garantir que está sempre definido

    try:
        current_user_identity_str = get_jwt_identity()
        current_user_identity = json.loads(current_user_identity_str)
        
        if current_user_identity is None:
            return jsonify({"message": "Token JWT inválido ou identidade faltando."}), 401

        user_id = current_user_identity.get('id')
        user_role = current_user_identity.get('role')

        if user_role != 'ong_protetor':
            return jsonify({"message": "Apenas ONGs/Protetores podem cadastrar animais."}), 403

        ong_protetor = OngProtetor.query.get(user_id)
        if not ong_protetor or not ong_protetor.aprovado:
            return jsonify({"message": "ONG/Protetor não encontrado ou não aprovado."}), 403

        foto_url = None
        if 'foto_principal' in request.files:
            file = request.files['foto_principal']
            if file.filename != '':
                if file and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file.save(file_path)
                    foto_url = f"http://localhost:5000/uploads/{filename}"
                else:
                    return jsonify({"message": "Tipo de arquivo não permitido ou erro no upload."}), 400
            else:
                return jsonify({"message": "Nenhum arquivo selecionado para foto principal."}), 400
        else:
            return jsonify({"message": "Campo 'foto_principal' ausente no formulário."}), 400

        nome = request.form.get('nome')
        especie = request.form.get('especie')
        raca = request.form.get('raca')
        porte = request.form.get('porte')
        idade_texto = request.form.get('idade_texto')
        sexo = request.form.get('sexo')
        cores = request.form.get('cores')
        saude = request.form.get('saude')
        personalidades_nomes = request.form.getlist('personalidades[]')
        descricao = request.form.get('descricao')
        status_adocao = request.form.get('status_adocao', 'Disponível')

        required_fields = ["nome", "especie", "porte", "idade_texto", "sexo", "descricao"]
        for field in required_fields:
            if not request.form.get(field): # Usa request.form.get para verificar campos
                if file_path and os.path.exists(file_path):
                    os.remove(file_path)
                return jsonify({"message": f"Campo '{field}' é obrigatório."}), 400

        personalidades_objetos = []
        for p_nome in personalidades_nomes:
            personalidade_db = Personalidade.query.filter_by(nome=p_nome).first()
            if personalidade_db:
                personalidades_objetos.append(personalidade_db)
            else:
                print(f"AVISO: Personalidade '{p_nome}' não encontrada no banco de dados. Ignorando.")

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
            foto_principal_url=foto_url,
            status_adocao=status_adocao,
            ong_protetor_id=user_id
        )

        db.session.add(novo_animal)
        db.session.commit()

        for pers_obj in personalidades_objetos:
            animal_personalidade = AnimalPersonalidade(animal=novo_animal, personalidade=pers_obj)
            db.session.add(animal_personalidade)
        
        db.session.commit()

        return jsonify({"message": "Animal cadastrado com sucesso!", "animal_id": novo_animal.id}), 201
    except Exception as e: # Captura exceções mais genéricas para logs
        if 'file_path' in locals() and file_path and os.path.exists(file_path):
            os.remove(file_path)
        print(f"ERRO ao criar animal: {str(e)}")
        traceback.print_exc()
        return jsonify({"message": f"Erro ao cadastrar animal: {str(e)}"}), 500

# Rota para servir arquivos estáticos (fotos)
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


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
    
# Adicione esta rota se você tiver uma página de "minha conta" para usuários
@app.route('/api/user/me', methods=['GET', 'PUT']) # Rota para GET e PUT
@jwt_required()
def get_user_profile():
    current_user_identity_str = get_jwt_identity()
    current_user_identity = json.loads(current_user_identity_str)
    user_id = current_user_identity['id']
    user_role = current_user_identity['role']

    # Lógica para requisições PUT (Atualizar perfil)
    if request.method == 'PUT':
        data = request.get_json()

        if user_role == 'usuario':
            user = Usuario.query.get(user_id)
            if not user:
                return jsonify({"message": "Usuário não encontrado."}), 404

            # Campos para atualização
            user.nome = data.get('nome', user.nome)
            # Email não deve ser alterado via esta rota (geralmente exige processo de verificação)
            # user.email = data.get('email', user.email) 

            # VALIDAÇÃO E LIMPEZA DE TELEFONE E ENDEREÇO AQUI:
            # Telefone
            telefone_input = data.get('telefone')
            # Verifica se o campo foi enviado E não está vazio/apenas espaços
            if not telefone_input or not str(telefone_input).strip():
                return jsonify({"message": "O campo Telefone é obrigatório."}), 400
            
            cleaned_telefone = ''.join(filter(str.isdigit, telefone_input))
            if not (10 <= len(cleaned_telefone) <= 11):
                return jsonify({"message": "Formato de telefone inválido. Deve ter 10 ou 11 dígitos numéricos (DDD + número)."}), 400
            user.telefone = cleaned_telefone
            
            # Endereço
            endereco_input = data.get('endereco')
            # Verifica se o campo foi enviado E não está vazio/apenas espaços
            if not endereco_input or not str(endereco_input).strip():
                return jsonify({"message": "O campo Endereço é obrigatório."}), 400
            
            stripped_endereco = str(endereco_input).strip()
            if not (5 <= len(stripped_endereco) <= 255):
                return jsonify({"message": "Endereço inválido. Deve ter entre 5 e 255 caracteres."}), 400
            user.endereco = stripped_endereco
            
            db.session.commit()
            return jsonify({"message": "Perfil de usuário atualizado com sucesso!", "profile": {
                "id": user.id,
                "nome": user.nome,
                "email": user.email, # Retorna o email, mesmo que não seja atualizado
                "telefone": user.telefone,
                "endereco": user.endereco,
                "role": "usuario"
            }}), 200

        elif user_role == 'ong_protetor':
            ong = OngProtetor.query.get(user_id)
            if not ong:
                return jsonify({"message": "ONG/Protetor não encontrado."}), 404
            
            # Campos para atualização
            ong.nome_organizacao = data.get('nome_organizacao', ong.nome_organizacao)
            ong.cnpj_cpf = data.get('cnpj_cpf', ong.cnpj_cpf)
            # Email não deve ser alterado via esta rota
            # ong.email = data.get('email', ong.email)

            # VALIDAÇÃO E LIMPEZA DE TELEFONE E ENDEREÇO AQUI PARA ONG/PROTETOR:
            # Telefone
            telefone_input = data.get('telefone')
            # Verifica se o campo foi enviado E não está vazio/apenas espaços
            if not telefone_input or not str(telefone_input).strip():
                return jsonify({"message": "O campo Telefone é obrigatório."}), 400
            
            cleaned_telefone = ''.join(filter(str.isdigit, telefone_input))
            if not (10 <= len(cleaned_telefone) <= 11):
                return jsonify({"message": "Formato de telefone inválido. Deve ter 10 ou 11 dígitos numéricos (DDD + número)."}), 400
            ong.telefone = cleaned_telefone
            
            # Endereço
            endereco_input = data.get('endereco')
            # Verifica se o campo foi enviado E não está vazio/apenas espaços
            if not endereco_input or not str(endereco_input).strip():
                return jsonify({"message": "O campo Endereço é obrigatório."}), 400
            
            stripped_endereco = str(endereco_input).strip()
            if not (5 <= len(stripped_endereco) <= 255):
                return jsonify({"message": "Endereço inválido. Deve ter entre 5 e 255 caracteres."}), 400
            ong.endereco = stripped_endereco

            db.session.commit()
            return jsonify({"message": "Perfil de ONG/Protetor atualizado com sucesso!", "profile": {
                "id": ong.id,
                "nome_organizacao": ong.nome_organizacao,
                "email": ong.email, # Retorna o email, mesmo que não seja atualizado
                "telefone": ong.telefone,
                "endereco": ong.endereco,
                "cnpj_cpf": ong.cnpj_cpf,
                "aprovado": ong.aprovado,
                "role": "ong_protetor"
            }}), 200

    # Lógica para requisições GET (Obter perfil)
    elif request.method == 'GET':
        if user_role == 'usuario':
            user = Usuario.query.get(user_id)
            if user:
                return jsonify({
                    "id": user.id,
                    "nome": user.nome,
                    "email": user.email,
                    "telefone": user.telefone,
                    "endereco": user.endereco,
                    "role": "usuario"
                }), 200
        elif user_role == 'ong_protetor':
            ong = OngProtetor.query.get(user_id)
            if ong:
                return jsonify({
                    "id": ong.id,
                    "nome_organizacao": ong.nome_organizacao,
                    "email": ong.email,
                    "telefone": ong.telefone,
                    "endereco": ong.endereco,
                    "cnpj_cpf": ong.cnpj_cpf,
                    "aprovado": ong.aprovado,
                    "role": "ong_protetor"
                }), 200
    
    return jsonify({"message": "Perfil não encontrado ou acesso negado."}), 404

# Adicione esta rota para atualizar animais
@app.route('/api/animals/<int:animal_id>', methods=['PUT'])
@jwt_required()
def update_animal(animal_id):
    current_user_identity_str = get_jwt_identity()
    current_user_identity = json.loads(current_user_identity_str)
    user_id = current_user_identity.get('id')
    user_role = current_user_identity.get('role')

    animal = Animal.query.get(animal_id)
    if not animal:
        return jsonify({"message": "Animal não encontrado."}), 404

    if user_role != 'ong_protetor' or animal.ong_protetor_id != user_id:
        return jsonify({"message": "Você não tem permissão para editar este animal."}), 403

    # Remove o código de upload de arquivo daqui se você não permite a atualização de fotos via PUT
    # Se permitir, a lógica deve ser similar à de create_animal, com tratamento para arquivo novo/existente.
    # Por simplicidade, assumindo que a foto_principal_url não é atualizada aqui.

    # Pega dados de JSON, pois PUTs geralmente enviam JSON, não FormData, a menos que especificado
    data = request.get_json() 

    animal.nome = data.get('nome', animal.nome)
    animal.especie = data.get('especie', animal.especie)
    animal.raca = data.get('raca', animal.raca)
    animal.porte = data.get('porte', animal.porte)
    animal.idade_texto = data.get('idade_texto', animal.idade_texto)
    animal.sexo = data.get('sexo', animal.sexo)
    animal.cores = data.get('cores', animal.cores)
    animal.saude = data.get('saude', animal.saude)
    animal.descricao = data.get('descricao', animal.descricao)
    animal.status_adocao = data.get('status_adocao', animal.status_adocao)

    # Lida com personalidades
    personalidades_nomes = data.get('personalidades', None)
    if personalidades_nomes is not None:
        # Remove todas as associações existentes
        AnimalPersonalidade.query.filter_by(animal_id=animal.id).delete()
        # Adiciona as novas associações
        for p_nome in personalidades_nomes:
            personalidade_db = Personalidade.query.filter_by(nome=p_nome).first()
            if personalidade_db:
                animal_personalidade = AnimalPersonalidade(animal=animal, personalidade=personalidade_db)
                db.session.add(animal_personalidade)
            else:
                print(f"AVISO: Personalidade '{p_nome}' não encontrada. Ignorando.")

    try:
        db.session.commit()
        return jsonify({"message": "Animal atualizado com sucesso!"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"ERRO ao atualizar animal: {str(e)}")
        traceback.print_exc()
        return jsonify({"message": f"Erro ao atualizar animal: {str(e)}"}), 500

# Adicione esta rota para deletar animais
@app.route('/api/animals/<int:animal_id>', methods=['DELETE'])
@jwt_required()
def delete_animal(animal_id):
    current_user_identity_str = get_jwt_identity()
    current_user_identity = json.loads(current_user_identity_str)
    user_id = current_user_identity.get('id')
    user_role = current_user_identity.get('role')

    animal = Animal.query.get(animal_id)
    if not animal:
        return jsonify({"message": "Animal não encontrado."}), 404

    if user_role != 'ong_protetor' or animal.ong_protetor_id != user_id:
        return jsonify({"message": "Você não tem permissão para deletar este animal."}), 403

    try:
        # Opcional: Remover a foto associada ao animal antes de deletar o registro
        if animal.foto_principal_url:
            # Extrai o nome do arquivo da URL (ex: 'http://localhost:5000/uploads/foto.jpg' -> 'foto.jpg')
            filename = os.path.basename(animal.foto_principal_url)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"Foto {filename} removida do servidor.")

        # Deleta as associações AnimalPersonalidade primeiro (devido ao CASCADE ondelete)
        AnimalPersonalidade.query.filter_by(animal_id=animal.id).delete()
        db.session.delete(animal)
        db.session.commit()
        return jsonify({"message": "Animal deletado com sucesso!"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"ERRO ao deletar animal: {str(e)}")
        traceback.print_exc()
        return jsonify({"message": f"Erro ao deletar animal: {str(e)}"}), 500

if __name__ == '__main__':
    # Cria a pasta de uploads se não existir ao iniciar o app
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    
    with app.app_context():
        db.create_all() # Cria as tabelas se elas não existirem
        
        # Opcional: Adicionar personalidades padrão se a tabela estiver vazia
        if not Personalidade.query.first():
            print("Adicionando personalidades padrão...")
            personalidades_padrao = [
                "Brincalhão", "Calmo", "Tímido", "Independente", "Sociável",
                "Curioso", "Energético", "Dócil", "Protetor", "Carinhoso",
                "Inteligente", "Destruidor", "Medroso", "Ativo", "Agressivo",
                "Carente", "Teimoso", "Tranquilo", "Adaptável", "Observador"
            ]
            for p_nome in personalidades_padrao:
                if not Personalidade.query.filter_by(nome=p_nome).first():
                    db.session.add(Personalidade(nome=p_nome))
            db.session.commit()
            print("Personalidades padrão adicionadas.")

    app.run(debug=True, port=5000)