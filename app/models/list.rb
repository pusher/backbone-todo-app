class List < ActiveRecord::Base
  # ---
  # Attributes
  #  - token

  has_many :items, :dependent => :delete_all
  before_create :create_token

  def self.find_by_token(token)
    self.includes(:items).where(:token => token).limit(1).first
  end

  def total_count
    items.count
  end

  def remaining_count
    items.where(:isdone => false).count
  end

  def as_json(options=nil)
    super({
      :except => :id,
      :methods => [:total_count, :remaining_count],
      :include => {
        :items => {
          :only => [:created_at, :updated_at, :shortdesc, :isdone]
        }
      }
    }.merge(options))
  end

  def channel_name
    @channel_name ||= "list-#{Rails.env}-#{strip_for_channel_name(self.token)}"
  end

  private

  def create_token
    self.token = strip_for_channel_name(SecureRandom.base64(8))
  end
  
  def strip_for_channel_name(str)
    str.gsub("/","").gsub("+","").gsub(/=+$/,"")
  end
end
